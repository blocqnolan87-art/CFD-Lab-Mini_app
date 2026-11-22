# CFD Lab — Mini-app éducative Telegram

Application web mobile-first en français : accueil, académie débutant, simulateur virtuel à bougies synthétiques, quiz et progression conservée sur l'appareil.

## Lancer et tester

- Aucun build requis : `index.html` est le point d'entrée.
- Tests automatiques : Node.js 20+ puis `npm test`.
- Hébergement prévu : GitHub Pages via `.github/workflows/deploy-pages.yml` ou Netlify via `netlify.toml`.

## Publication GitHub Pages

1. Dans GitHub, ouvrir **Settings → Pages**.
2. Sous **Build and deployment**, choisir **GitHub Actions** comme source.
3. La workflow de déploiement publie ensuite le site lors des pushes sur `main`. Vérifier son résultat dans l'onglet **Actions**.
4. L'URL du site sera de la forme `https://blocqnolan87-art.github.io/CFD-Lab-Mini_app/` (à confirmer une fois le déploiement terminé).

## Dernière étape Telegram (à faire après publication)

Dans BotFather, configurer le bouton/menu de la Mini App avec l'URL HTTPS publiée. Aucun token Telegram n'est requis dans le code du site statique. Tester ensuite l'ouverture depuis Telegram sur iPhone.

## Sécurité et limites actuelles

- Produit d'apprentissage, pas de conseil financier.
- Les cours affichés sont synthétiques et ne sont pas des cotations de marché ni un historique réel.
- Capital simulé uniquement : pas de connexion broker/Revolut, pas d'ordre réel.
- Modèle de PnL volontairement simplifié, sans spread, commissions, financement, marge ou liquidation.
- La progression pédagogique est stockée localement dans le navigateur.
- Ne jamais committer de tokens, clés API, identifiants ou secrets.
- Le code prépare le SDK Telegram côté client; le bot et son URL seront configurés à la fin.

## Suite de développement

Avant un test éducatif plus avancé : implémenter des positions virtuelles persistantes, une clôture explicite, un journal de trades, l'import CSV OHLC validé et un replay sans look-ahead. Les données de marché doivent être sourcées et documentées avant toute utilisation pédagogique réaliste.
