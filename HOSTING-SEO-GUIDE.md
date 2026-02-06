# 🚀 Complete Hosting & SEO Guide for LÁ MANGÁ

This guide will help you host your website on GitHub Pages, connect your Namecheap domain, and optimize for Google search rankings.

---

## ✅ SEO Enhancements Added

Your website now includes comprehensive SEO:

- **Meta tags**: Title, description, keywords optimized for "Mirissa hotel" searches
- **Open Graph**: For Facebook/social sharing
- **Twitter Cards**: For Twitter sharing
- **Geo tags**: Local SEO for Sri Lanka/Mirissa
- **Schema.org structured data**: Hotel & LocalBusiness markup for rich snippets
- **sitemap.xml**: For search engine crawling
- **robots.txt**: Search engine instructions
- **CNAME**: For custom domain on GitHub Pages

---

## 📦 Step 1: Push to GitHub

### Option A: Using Command Line

```bash
# Navigate to project folder
cd "/media/spdanuraj/windows 11/Business Projects Ideas/LaManga"

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - LÁ MANGÁ hotel website"
```

### Create Repository on GitHub

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon → **New repository**
3. Name it: `lamanga-website` (or `lamangamirissa.github.io` for user site)
4. Keep it **Public**
5. **Don't** initialize with README
6. Click **Create repository**

### Push Your Code

```bash
# Add remote origin (replace dimuthuanuraj with your GitHub username)
git remote add origin https://github.com/dimuthuanuraj/lamanga-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **"Build and deployment"**:
   - **Source**: Deploy from a branch
   - **Branch**: Select `main`
   - **Folder**: Select `/ (root)`
5. Click **Save**
6. Wait 2-3 minutes

Your site will be live at: `https://dimuthuanuraj.github.io/lamanga-website/`

---

## 🔗 Step 3: Connect Namecheap Domain

### 3.1 Configure Namecheap DNS

1. Log in to [Namecheap](https://www.namecheap.com/)
2. Go to **Domain List**
3. Click **Manage** next to `lamangamirissa.com`
4. Click **Advanced DNS** tab
5. **Delete** any existing A or CNAME records for `@` and `www`
6. Add these **NEW** records:

#### A Records (for root domain)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 185.199.108.153 | Automatic |
| A Record | @ | 185.199.109.153 | Automatic |
| A Record | @ | 185.199.110.153 | Automatic |
| A Record | @ | 185.199.111.153 | Automatic |

#### CNAME Record (for www subdomain)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | dimuthuanuraj.github.io. | Automatic |

> ⚠️ **Important**: Replace `dimuthuanuraj` with your actual GitHub username. Include the trailing dot (`.`) after `github.io`

### 3.2 Configure GitHub Pages Custom Domain

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Custom domain**, enter: `lamangamirissa.com`
4. Click **Save**
5. Wait for DNS check (may take 10-30 minutes)
6. Once verified, check ✅ **Enforce HTTPS**

### 3.3 Verify DNS Propagation

Check if DNS has propagated using:
- [dnschecker.org](https://dnschecker.org/)
- Enter `lamangamirissa.com` and check A records

DNS propagation can take anywhere from 10 minutes to 48 hours (usually under 1 hour).

---

## 🔍 Step 4: Submit to Google Search Console

### 4.1 Add Your Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **URL prefix** method
4. Enter: `https://lamangamirissa.com`
5. Click **Continue**

### 4.2 Verify Ownership

**Option A: HTML Tag (Recommended)**
1. Copy the meta tag Google provides
2. Add it to your `index.html` `<head>` section
3. Push changes to GitHub
4. Click **Verify** in Search Console

**Option B: DNS TXT Record**
1. Copy the TXT record value from Google
2. Go to Namecheap → Advanced DNS
3. Add a TXT record:
   - Host: `@`
   - Value: (paste Google's value)
   - TTL: Automatic
4. Wait 10-15 minutes, then click **Verify**

### 4.3 Submit Your Sitemap

1. In Search Console, click **Sitemaps** (left menu)
2. Enter: `sitemap.xml`
3. Click **Submit**

### 4.4 Request Indexing

1. Go to **URL Inspection** (left menu)
2. Enter your homepage URL
3. Click **Request Indexing**

---

## 📈 Step 5: Rank for "Mirissa" Searches

### 5.1 Google My Business (CRITICAL!)

This is the **most important** step for local searches:

1. Go to [Google Business Profile](https://business.google.com/)
2. Click **Manage now**
3. Enter business name: **LÁ MANGÁ**
4. Choose category: **Hotel** or **Guest House**
5. Add your address:
   ```
   Withanagoda Road, Madina Watta
   Udupila, Mirissa
   Sri Lanka 81740
   ```
6. Add phone: `+94 76 209 6130`
7. Add website: `https://lamangamirissa.com`
8. Upload photos from your gallery
9. Set business hours
10. Write a business description with keywords

### 5.2 Get Listed on Travel Platforms

Ensure your listings link back to your website:

- ✅ [Booking.com](https://join.booking.com/) - Already listed!
- ⬜ [TripAdvisor](https://www.tripadvisor.com/Owners)
- ⬜ [Agoda](https://partners.agoda.com/)
- ⬜ [Expedia](https://join.expediapartnercentral.com/)
- ⬜ [Airbnb](https://www.airbnb.com/host)
- ⬜ [Hotels.com](https://www.hotels.com/)

### 5.3 Social Media Strategy

**Instagram** (@la_manga_2026):
- Post daily/weekly with hashtags:
  ```
  #Mirissa #MirissaHotel #MirissaBeach #SriLanka 
  #CoconutTreeHill #WhaleWatchingMirissa #SriLankaTravel
  #MirissaAccommodation #SouthCoastSriLanka #VisitSriLanka
  ```
- Add website link in bio
- Use location tags: Mirissa, Sri Lanka

**Facebook**:
- Create business page
- Link to website
- Share guest photos and reviews

### 5.4 SEO Keywords Your Site Targets

Your website is optimized for these search terms:

| Primary Keywords | Secondary Keywords |
|-----------------|-------------------|
| Mirissa hotel | Mirissa guest house |
| Mirissa accommodation | boutique hotel Mirissa |
| best hotel Mirissa | Mirissa Sri Lanka stay |
| Coconut Tree Hill hotel | whale watching Mirissa hotel |
| Mirissa beach hotel | south coast Sri Lanka accommodation |

### 5.5 Get Backlinks

Contact these for reviews/features:

- Travel bloggers who write about Sri Lanka
- Sri Lanka tourism websites
- Expat forums and travel forums
- Local tourism board: [Sri Lanka Tourism](https://www.srilanka.travel/)

### 5.6 Encourage Google Reviews

Ask satisfied guests to:
1. Search "LÁ MANGÁ Mirissa" on Google
2. Click on your Google Business listing
3. Leave a 5-star review

More reviews = Higher ranking in local searches!

---

## 📁 Your Website Files

```
LaManga/
├── index.html          # Main website (with SEO)
├── review-form.html    # Guest review submission form
├── sitemap.xml         # Search engine sitemap
├── robots.txt          # Search engine crawl rules
├── CNAME               # GitHub Pages custom domain
└── public/
    ├── css/
    │   └── style.css   # All styling
    ├── js/
    │   └── script.js   # Interactivity
    └── images/
        ├── logo.png
        ├── gallery/    # 21 gallery images
        └── sunset/     # Sunset room images
```

---

## ⏱️ Timeline Expectations

| Task | Expected Time |
|------|---------------|
| GitHub Pages goes live | 2-5 minutes |
| DNS propagation | 10 minutes - 48 hours (usually ~30 min) |
| HTTPS certificate | 15-60 minutes after DNS |
| Google crawls your site | 1-7 days |
| Appears in search results | 1-4 weeks |
| Ranking improvement | 2-8 weeks |
| Strong local presence | 2-6 months |

---

## 🔧 Troubleshooting

### Site not loading on custom domain?
- Wait for DNS propagation (check dnschecker.org)
- Verify CNAME file exists with correct domain
- Check GitHub Pages settings shows domain as verified

### HTTPS not working?
- HTTPS takes ~15-60 minutes after DNS verification
- Ensure "Enforce HTTPS" is checked in GitHub Pages settings

### Not appearing in Google?
- Submit sitemap in Search Console
- Request indexing for your URLs
- Be patient - indexing takes 1-7 days

### Images not loading?
- Check image paths are correct
- Ensure images are committed to GitHub
- Clear browser cache

---

## 📞 Quick Reference

| Resource | URL |
|----------|-----|
| Your Website | https://lamangamirissa.com |
| Review Form | https://lamangamirissa.com/review-form.html |
| GitHub Repository | https://github.com/dimuthuanuraj/lamanga-website |
| Google Search Console | https://search.google.com/search-console |
| Google Business Profile | https://business.google.com |
| Namecheap DNS | https://ap.www.namecheap.com/domains/domaincontrolpanel/lamangamirissa.com/advancedns |
| Booking.com Listing | https://www.booking.com/hotel/lk/la-manga-mirissa.html |

---

## ✅ Checklist

- [ ] Push code to GitHub
- [ ] Enable GitHub Pages
- [ ] Add DNS records in Namecheap
- [ ] Set custom domain in GitHub Pages
- [ ] Enable HTTPS
- [ ] Verify in Google Search Console
- [ ] Submit sitemap
- [ ] Create Google Business Profile
- [ ] Link from Booking.com to website
- [ ] Set up Instagram with website link
- [ ] Set up Facebook business page
- [ ] Ask first guests for Google reviews

### Review Form Setup
- [ ] Set up Formspree account at [formspree.io](https://formspree.io/)
- [ ] Create new form and copy Form ID
- [ ] Replace `YOUR_FORM_ID` in `review-form.html` with actual Form ID
- [ ] Get Google Place ID from [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
- [ ] Replace `YOUR_PLACE_ID` in `review-form.html` with actual Place ID
- [ ] Test review form submission

### Email Setup
- [ ] Set up email forwarding in Namecheap (Domain → Redirect Email)
- [ ] Forward `info@lamangamirissa.com` to personal email

---

**Good luck with LÁ MANGÁ! 🏨🌴**

*Last updated: February 2026*
