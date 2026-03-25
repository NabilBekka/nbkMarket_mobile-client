# NBK Market — Application Mobile Client

Application mobile pour les utilisateurs de NBK Market. Permet de parcourir les boutiques, rechercher des produits par catégorie et wilaya, et contacter directement les commerçants.

## Stack technique

- React Native 0.81.5
- Expo SDK 54
- Expo Router 6
- TypeScript

## Prérequis

- Node.js (LTS)
- Expo Go installé sur ton téléphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

## Installation

```bash
npm install
```

## Lancement

```bash
npx expo start
```

Scanne le QR code avec Expo Go pour voir l'app sur ton téléphone.

## Structure

```
app/
├── _layout.tsx    # Layout racine (Stack navigator)
└── index.tsx      # Écran d'accueil
src/
├── components/    # Composants réutilisables
├── hooks/         # Custom hooks
├── lib/           # Utilitaires
├── screens/       # Écrans complexes
├── services/      # Appels API
├── styles/        # Thème et constantes
└── types/         # Types TypeScript
assets/            # Images, icônes, fonts
```

## Design

- Thème : Bleu nuit (`#0B1A2E`) + blanc + accent cyan (`#4FC3F7`)
- Navigation par onglets : Accueil, Explorer, Messages, Favoris, Profil
- Cartes produits avec emoji, prix en DA, localisation par wilaya
- Contact direct : appel, message, déplacement
