# Virtual Try-On: Fit Check

A virtual fitting room powered by advanced image generation AI. Upload a photo of yourself and an outfit to see how it looks on you, change poses, and build a gallery of your creations.

![Virtual Try-On App Screenshot](https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png)

## ✨ Features

- **AI Model Creation:** Upload your photo to generate a personalized, professional fashion model while preserving your likeness.
- **Virtual Try-On:** Seamlessly apply various clothing items from the wardrobe to your model.
- **Outfit Stacking:** Layer multiple garments—tops, bottoms, shoes, and accessories—to create complete, realistic outfits.
- **Dynamic Pose Generation:** Don't just stand there! Change your model's pose with a single click from a library of over 200 industry-standard poses for fashion, e-commerce, and more.
- **Custom Wardrobe:** Use the default items provided or upload images of your own clothes to see how they fit.
- **Creations Gallery:** All your generated outfits and poses are automatically saved to a gallery for easy viewing and downloading.
- **Download Everything:** Download individual images or get a ZIP file of your entire collection.
- **Responsive Design:** A fluid experience that works beautifully on desktop, tablet, and mobile devices.
- **Dark/Light Mode:** Switch between themes for your viewing comfort.

## 🚀 How It Works

1.  **API Key (One-time setup):** This app uses the [Replicate API](https://replicate.com/) for image generation. On your first visit, you'll be prompted to enter your Replicate API key, which is then saved securely in your browser's local storage for future use.
2.  **Create Your Model:** Start by uploading a clear, full-body photo of yourself. The AI will generate a professional model based on your photo.
3.  **Style Your Outfit:** Once your model is ready, use the side panel to browse the wardrobe. The wardrobe is categorized into tops, bottoms, shoes, accessories, and held items. Click an item to apply it to your model.
4.  **Change Poses:** Use the "Change Pose" section to explore different stances. You can filter poses by industry (e.g., E-commerce, Lifestyle) or category to find the perfect one.
5.  **View & Download:** As you create, every unique image is added to a persistent gallery. Click the "View Gallery" button to see all your creations, download individual images, or download all of them in a single ZIP file.
6.  **Start Over:** Want a fresh start? The "Start Over" button will clear your session and take you back to the model creation screen.

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **AI / Image Generation:** [Replicate](https://replicate.com/) API (utilizing an advanced virtual try-on model).
- **Animation:** [Framer Motion](https://www.framer.com/motion/) for smooth transitions and animations.
- **Icons:** A custom set of SVG icons.
- **Development:** The app is built to run directly in the browser using ES modules loaded from [esm.sh](https://esm.sh/), requiring no local installation or build step.

## 🔧 Running Locally

This project is designed to be incredibly simple to run locally.

1.  **Clone the repository or download the files.**
2.  **Serve the files.** Since there's no build process, you just need a simple local web server.
    - If you have Python installed, you can run: `python -m http.server`
    - If you use VS Code, the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) is a great option.
3.  **Open your browser** and navigate to the local server's address (e.g., `http://localhost:8000`).
4.  The application will prompt you for your Replicate API key. Paste it in to begin.

## 💡 How to Remix

The footer of the app provides rotating suggestions for how you could extend this project. Here are a few ideas to get you started:

- **E-commerce Integration:** Connect to a shopping API (like the Shopify API) to fetch real products and see how they look on you.
- **Add More Categories:** Extend the wardrobe to include accessories like hats, sunglasses, or bags.
- **Color Variations:** Add a feature to generate different colorways for the garments you're trying on.
- **Share to Social Media:** Implement a "Share" button to post your favorite looks directly to social platforms.
- **Style Score:** Create an AI-powered "style score" that gives feedback on your outfit combinations.

## 📄 License

This project is licensed under the **Apache 2.0 License**. See the `LICENSE` file for details.
