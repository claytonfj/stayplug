# StayPlug

Toutes les marques de vêtements que tu suis sur Instagram, au même endroit :
articles filtrables par catégorie (jeans, pulls, accessoires…), par marque, par prix,
favoris, et lien direct vers le site officiel de chaque marque.

Site web installable sur iPhone/Android (PWA), sans App Store, sans frais.

## Tester en local

```sh
npm run dev
```

Ouvre http://localhost:4173. Le terminal affiche aussi une adresse pour ton téléphone
(il doit être sur le même Wi-Fi).

## Ajouter tes marques

1. Export Instagram → `following.json`, puis :
   ```sh
   npm run import -- ~/Downloads/following.json
   ```
   Ça crée `data/instagram-following.json` (tous tes abonnements).
2. Les marques retenues vont dans `public/data/brands.json` :
   ```json
   { "id": "nom-marque", "name": "Nom Marque", "instagram": "nommarque", "site": "https://www.nommarque.com", "logo": null }
   ```
3. Récupère les articles des marques sous Shopify :
   ```sh
   npm run fetch
   ```
   Les marques qui ne sont pas sous Shopify restent visibles dans l'onglet Marques
   avec leur lien, mais sans articles.
4. Photos de profil Instagram des marques (logos) :
   ```sh
   npm run insta            # toutes les marques
   npm run insta -- --missing   # seulement celles sans logo
   ```

`npm run demo` remet les données de démonstration.

## Mettre en ligne (gratuit)

1. Crée un dépôt sur GitHub et pousse ce dossier.
2. Dans le dépôt : Settings → Pages → Source : **GitHub Actions**.
3. Le site est publié sur `https://<ton-pseudo>.github.io/<dépôt>/`, et les articles
   se mettent à jour chaque nuit tout seuls (`.github/workflows/refresh.yml`).

Sur iPhone : ouvre le site dans Safari → Partager → **Sur l'écran d'accueil**.
