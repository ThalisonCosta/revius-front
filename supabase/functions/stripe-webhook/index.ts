import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    logStep("Keys verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) throw new Error("No stripe signature found");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type });
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });
        
        if (session.mode === 'subscription') {
          await handleSubscriptionActivated(session, supabaseClient);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id, customerId: invoice.customer });
        
        if (invoice.subscription) {
          await handleSubscriptionRenewed(invoice, supabaseClient);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, customerId: invoice.customer });
        
        if (invoice.subscription) {
          await handlePaymentFailed(invoice, supabaseClient);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", { subscriptionId: subscription.id, customerId: subscription.customer });
        
        await handleSubscriptionCancelled(subscription, supabaseClient);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });
        
        await handleSubscriptionUpdated(subscription, supabaseClient);
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSubscriptionActivated(session: Stripe.Checkout.Session, supabase: any) {
  const customerId = session.customer as string;
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || 'pro';
  
  logStep("Activating subscription", { customerId, userId, tier });
  
  if (!userId) {
    logStep("No user_id in metadata, skipping");
    return;
  }
  
  await supabase.from("users").update({
    subscription_tier: tier,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  
  logStep("Subscription activated successfully", { userId, tier });
}

async function handleSubscriptionRenewed(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  
  // Buscar usuário pelo Stripe customer ID
  const { data: customer } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (!customer) {
    logStep("Customer not found in database", { customerId });
    return;
  }
  
  logStep("Subscription renewed successfully", { userId: customer.id });
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  
  // Buscar usuário pelo Stripe customer ID
  const { data: customer } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (!customer) {
    logStep("Customer not found in database", { customerId });
    return;
  }
  
  // Não downgrade imediatamente, apenas log o falha
  logStep("Payment failed for user", { userId: customer.id });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  
  // Buscar usuário pelo Stripe customer ID
  const { data: customer } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (!customer) {
    logStep("Customer not found in database", { customerId });
    return;
  }
  
  // Downgrade para free quando subscription é cancelada
  await supabase.from("users").update({
    subscription_tier: 'free',
    updated_at: new Date().toISOString(),
  }).eq('id', customer.id);
  
  logStep("Subscription cancelled, user downgraded", { userId: customer.id });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  
  // Buscar usuário pelo Stripe customer ID
  const { data: customer } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (!customer) {
    logStep("Customer not found in database", { customerId });
    return;
  }
  
  // Se subscription foi pausada ou cancelada, downgrade
  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    await supabase.from("users").update({
      subscription_tier: 'free',
      updated_at: new Date().toISOString(),
    }).eq('id', customer.id);
    
    logStep("Subscription status changed, user downgraded", { 
      userId: customer.id, 
      status: subscription.status 
    });
  }
}