# Mystic Tarot (神秘塔罗)

A modern, high-fidelity Tarot reading application built with React 18 and Vite.

## Features

- **Full 78-Card Deck**: Complete Major and Minor Arcana with bilingual (English/Chinese) meanings.
- **Premium Aesthetics**:
  - High-definition illustrations for Major Arcana.
  - Realistic, procedural "Pip" layouts (Wands, Cups, Swords, Pentacles) for Minor Arcana.
  - Parchment textures and dynamic lighting effects.
- **Interactive Readings**:
  - Realistic fan-style card selection with smooth animations.
  - 3-Card Spread (Past, Present, Future) with automated interpretation.
- **History**: Automatically saves your readings for later reflection.
- **Gallery**: Browse the entire deck and view details for every card.
- **Bilingual**: Seamlessly switch between English and Chinese.

## Tech Stack

- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Animation**: Framer Motion
- **Icons**: Custom high-fidelity 3D assets

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/components`: UI Components (Card, CardSelector, Spread, etc.)
- `src/data`: Tarot card data
- `src/assets`: Images and textures
- `src/hooks`: Custom hooks (useTranslation)
- `src/locales`: Localization files

## License

MIT
