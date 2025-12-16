

```markdown
# Taste of Bharat – Modern Indian Restaurant Website 🍛

A premium, responsive, and SEO-optimized website template designed for **Taste of Bharat**, a modern Indian restaurant in Swindon, UK. This site features high-end animations, a dynamic menu system, and a fully functional table reservation form.

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Design](https://img.shields.io/badge/Design-Premium-orange)

## ✨ Features

* **Premium UI/UX:** "Warm Luxury" aesthetic with noise textures, cinematic typography, and golden glow effects.
* **Fully Responsive:** Optimized for mobile, tablet, and desktop (includes mobile swipeable menu).
* **Dynamic Menu:** JavaScript-powered menu with category filtering and instant search.
* **Reservation System:** Integrated booking form using [FormSubmit](https://formsubmit.co) (No backend required).
* **Modern Animations:** Scroll reveal effects, magnetic buttons, floating hero images, and staggered menu loading.
* **Social Proof:** "Trusted by Locals" section with 5-star ratings.
* **Contact Integration:** Embedded Google Maps, click-to-call buttons, and WhatsApp integration.

## 📂 Project Structure

Ensure your folder contains the following files for the site to load correctly:

```text
/taste-of-bharat
│
├── index.html          # Main HTML file containing structure, styles, and logic
├── README.md           # Documentation
│
├── logo.jpg            # Restaurant logo (displayed in header)
├── hero.jpg            # Main hero image (Sizzler/Grill)
├── feast.jpg           # Gallery image (Large feast spread)
├── Starters.jpg        # Gallery image (Crispy starters - Note capital 'S')
├── paneer.jpg          # Gallery image (Paneer tikka)
└── dessert.jpg         # Gallery image (Pineapple dessert)

```

##🚀 How to Host on GitHub Pages (Free)1. **Upload Files:** Upload `index.html` and all 6 images to your GitHub repository.
2. **Go to Settings:** Click on the **Settings** tab in your repository.
3. **Pages:** On the left sidebar, click **Pages**.
4. **Build and deployment:** Under **Branch**, select `main` (or `master`) and click **Save**.
5. **Wait:** In about 1-2 minutes, refresh the page. GitHub will provide a link (e.g., `https://yourusername.github.io/taste-of-bharat/`).

##⚙️ Configuration & Customization###1. Changing the MenuOpen `index.html` and scroll to the bottom `<script>` section. Look for `const menuItems`. You can add, remove, or edit dishes there:

```javascript
const menuItems = [
  {
    "category": "New Category",
    "name": "New Dish Name", 
    "desc": "Description of the dish.", 
    "price": "£10.90"
  },
  // ... existing items
];

```

###2. Configuring the Booking FormThe form uses **FormSubmit** to send emails without a backend server.

1. In `index.html`, find the `<form>` tag inside the `#contact` section.
2. Ensure the email address is correct:
```html
<form action="[https://formsubmit.co/kamalshelley@gmail.com](https://formsubmit.co/kamalshelley@gmail.com)" method="POST">

```


3. **Important:** The first time you test the form on the live site, you will receive an activation email from FormSubmit. Click **"Activate"** in that email.

###3. Updating ImagesTo change images, simply replace the `.jpg` files in your folder with new images using the **exact same filenames** (`hero.jpg`, `logo.jpg`, etc.). This requires no code changes.

##📱 Mobile Features* **Sticky Menu:** Categories become a swipeable horizontal bar on mobile.
* **Click-to-Call:** Phone numbers are active links.
* **No-Overlap Forms:** Date and time inputs stack vertically on small screens for better usability.

##🛠️ Technologies Used* HTML5
* CSS3 (Variables, Flexbox, Grid, Animations)
* Vanilla JavaScript (ES6+)
* Google Fonts (Playfair Display & DM Sans)
* FontAwesome (SVG Icons used directly)

---

© 2025 Taste of Bharat. All rights reserved.

```

```
