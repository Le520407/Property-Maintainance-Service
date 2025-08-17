# Images Folder Structure

## 📁 Folder Organization

```
public/images/
├── blog/           # Blog post featured images
├── placeholders/   # Default/fallback images
├── services/       # Service-related images
└── banners/        # Banner/hero images
```

## 🖼️ Usage Examples

### Blog Images
- Place blog featured images in `/blog/` folder
- Use URLs like: `http://localhost:3000/images/blog/maintenance-tips.jpg`

### Placeholders
- Default images when no featured image is provided
- Use URLs like: `http://localhost:3000/images/placeholders/blog-default.jpg`

## 📋 Naming Convention
- Use kebab-case: `maintenance-tips-header.jpg`
- Include descriptive names: `plumbing-repair-guide.png`
- Avoid spaces and special characters

## 🎯 Recommended Image Sizes
- **Blog Featured Images**: 1200x630px (optimal for social sharing)
- **Thumbnails**: 400x300px
- **Banners**: 1920x600px

## 📂 File Formats
- **JPEG**: Photos and complex images
- **PNG**: Images with transparency
- **WebP**: Modern format for better compression