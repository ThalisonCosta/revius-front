import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Sync subscription status started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Buscar todos os usuários com subscription_tier que não seja 'free'
    const { data: paidUsers, error } = await supabaseClient
      .from('users')
      .select('id, email, subscription_tier, stripe_customer_id')
      .neq('subscription_tier', 'free');

    if (error) {
      throw new Error(`Error fetching paid users: ${error.message}`);
    }

    let updatedCount = 0;
    let downgradedCount = 0;

    for (const user of paidUsers) {
      logStep("Checking user subscription", { userId: user.id, email: user.email });

      try {
        // Buscar customer no Stripe
        let customerId = user.stripe_customer_id;
        
        if (!customerId) {
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (customers.data.length === 0) {
            // Usuário não tem customer no Stripe, downgrade para free
            await supabaseClient.from("users").update({
              subscription_tier: 'free',
              updated_at: new Date().toISOString(),
            }).eq('id', user.id);
            
            downgradedCount++;
            logStep("User downgraded - no Stripe customer", { userId: user.id });
            continue;
          }
          customerId = customers.data[0].id;
          
          // Atualizar customer ID no banco
          await supabaseClient.from("users").update({
            stripe_customer_id: customerId,
          }).eq('id', user.id);
        }

        // Verificar subscription ativa
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          // Não há subscription ativa, downgrade para free
          await supabaseClient.from("users").update({
            subscription_tier: 'free',
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
          
          downgradedCount++;
          logStep("User downgraded - no active subscription", { userId: user.id });
        } else {
          // Verificar se o tier está correto
          const subscription = subscriptions.data[0];
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          let correctTier = 'pro';
          if (amount <= 999) {
            correctTier = "pro";
          } else if (amount <= 2499) {
            correctTier = "premium";
          } else {
            correctTier = "enterprise";
          }
          
          if (user.subscription_tier !== correctTier) {
            await supabaseClient.from("users").update({
              subscription_tier: correctTier,
              updated_at: new Date().toISOString(),
            }).eq('id', user.id);
            
            updatedCount++;
            logStep("User tier updated", { 
              userId: user.id, 
              from: user.subscription_tier, 
              to: correctTier 
            });
          }
        }
      } catch (userError) {
        logStep("Error processing user", { 
          userId: user.id, 
          error: userError.message 
        });
      }
    }

    const result = {
      processed: paidUsers.length,
      updated: updatedCount,
      downgraded: downgradedCount,
      timestamp: new Date().toISOString()
    };

    logStep("Sync completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-subscription-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});