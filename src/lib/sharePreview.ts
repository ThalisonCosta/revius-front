import html2canvas from 'html2canvas';

export const generateSharePreview = async (
  type: 'review' | 'list' | 'profile', 
  data: any
): Promise<Blob> => {
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1080px';
  container.style.height = '1080px';
  container.style.background = 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground)) 100%)';
  container.style.fontFamily = 'Inter, system-ui, sans-serif';
  container.style.color = 'white';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  
  document.body.appendChild(container);

  try {
    let content = '';
    
    switch (type) {
      case 'review':
        content = createReviewPreview(data);
        break;
      case 'list':
        content = createListPreview(data);
        break;
      case 'profile':
        content = createProfilePreview(data);
        break;
    }
    
    container.innerHTML = content;
    
    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        });
      })
    );

    // Generate canvas
    const canvas = await html2canvas(container, {
      width: 1080,
      height: 1080,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0);
    });
  } finally {
    document.body.removeChild(container);
  }
};

const createReviewPreview = (data: any): string => {
  const stars = '★'.repeat(data.rating || 0) + '☆'.repeat(5 - (data.rating || 0));
  
  return `
    <div style="text-align: center; width: 100%; max-width: 900px;">
      <!-- Media Poster -->
      <div style="margin-bottom: 40px;">
        <img 
          src="${data.poster || '/placeholder.svg'}" 
          alt="${data.title}"
          style="width: 300px; height: 450px; object-fit: cover; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.3);"
          crossorigin="anonymous"
        />
      </div>
      
      <!-- Review Info -->
      <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px;">
          <img 
            src="${data.user?.avatar_url || '/placeholder.svg'}" 
            alt="${data.user?.username}"
            style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid white;"
            crossorigin="anonymous"
          />
          <div style="text-align: left;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${data.user?.username || 'Anonymous'}</div>
            <div style="font-size: 32px; color: #FFD700;">${stars}</div>
          </div>
        </div>
        
        <h2 style="font-size: 36px; font-weight: bold; margin-bottom: 20px; line-height: 1.2;">${data.title}</h2>
        
        ${data.review_text ? `
          <p style="font-size: 20px; line-height: 1.6; opacity: 0.9; max-width: 600px; margin: 0 auto;">
            "${data.review_text.substring(0, 150)}${data.review_text.length > 150 ? '...' : ''}"
          </p>
        ` : ''}
        
        <div style="margin-top: 40px; font-size: 18px; opacity: 0.8;">
          Reviewed on Revius
        </div>
      </div>
    </div>
  `;
};

const createListPreview = (data: any): string => {
  const items = data.items || [];
  const displayItems = items.slice(0, 4);
  
  return `
    <div style="text-align: center; width: 100%; max-width: 900px;">
      <!-- List Items Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto;">
        ${displayItems.map((item: any) => `
          <img 
            src="${item.media_thumbnail || '/placeholder.svg'}" 
            alt="${item.media_title}"
            style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
            crossorigin="anonymous"
          />
        `).join('')}
        ${displayItems.length < 4 ? Array(4 - displayItems.length).fill('').map(() => `
          <div style="width: 100%; aspect-ratio: 2/3; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; opacity: 0.5;">
            +
          </div>
        `).join('') : ''}
      </div>
      
      <!-- List Info -->
      <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
        <h2 style="font-size: 42px; font-weight: bold; margin-bottom: 20px; line-height: 1.2;">${data.name}</h2>
        
        ${data.description ? `
          <p style="font-size: 20px; line-height: 1.6; opacity: 0.9; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
            ${data.description.substring(0, 120)}${data.description.length > 120 ? '...' : ''}
          </p>
        ` : ''}
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 30px;">
          <img 
            src="${data.user?.avatar_url || '/placeholder.svg'}" 
            alt="${data.user?.username}"
            style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid white;"
            crossorigin="anonymous"
          />
          <span style="font-size: 22px; font-weight: 600;">by ${data.user?.username || 'Anonymous'}</span>
        </div>
        
        <div style="margin-top: 20px; font-size: 18px; opacity: 0.8;">
          ${items.length} items • Shared from Revius
        </div>
      </div>
    </div>
  `;
};

const createProfilePreview = (data: any): string => {
  const recentContent = data.recentContent || [];
  
  return `
    <div style="text-align: center; width: 100%; max-width: 900px;">
      <!-- Profile Avatar -->
      <div style="margin-bottom: 40px;">
        <img 
          src="${data.avatar_url || '/placeholder.svg'}" 
          alt="${data.username}"
          style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 6px solid white; box-shadow: 0 20px 40px rgba(0,0,0,0.3);"
          crossorigin="anonymous"
        />
      </div>
      
      <!-- Profile Info -->
      <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); margin-bottom: 40px;">
        <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 15px;">${data.username}</h1>
        
        ${data.bio ? `
          <p style="font-size: 22px; line-height: 1.6; opacity: 0.9; margin-bottom: 25px; max-width: 500px; margin-left: auto; margin-right: auto;">
            ${data.bio.substring(0, 100)}${data.bio.length > 100 ? '...' : ''}
          </p>
        ` : ''}
        
        <div style="display: flex; justify-content: center; gap: 40px; font-size: 18px;">
          <div><strong>${data.stats?.lists_count || 0}</strong> Lists</div>
          <div><strong>${data.stats?.reviews_count || 0}</strong> Reviews</div>
          <div><strong>${data.stats?.followers_count || 0}</strong> Followers</div>
        </div>
      </div>
      
      <!-- Recent Content -->
      ${recentContent.length > 0 ? `
        <div>
          <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 20px; opacity: 0.9;">Recent Activity</h3>
          <div style="display: flex; justify-content: center; gap: 15px;">
            ${recentContent.slice(0, 3).map((item: any) => `
              <img 
                src="${item.thumbnail || '/placeholder.svg'}" 
                alt="${item.title}"
                style="width: 120px; height: 180px; object-fit: cover; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);"
                crossorigin="anonymous"
              />
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-top: 30px; font-size: 18px; opacity: 0.8;">
        Follow on Revius
      </div>
    </div>
  `;
};