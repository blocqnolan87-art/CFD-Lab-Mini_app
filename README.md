# CFD Lab — Mini-app éducative Telegram

Application web mobile-first en français : accueil, académie débutant (12 leçons), simulateur virtuel à bougies synthétiques, quiz et progression conservée sur l'appareil.

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
- Le moteur propose des scénarios pédagogiques de spread, commission, financement overnight, glissement, marge et alerte de maintenance; les paramètres sont saisis et ne représentent pas les conditions d'un courtier. Aucun mécanisme réel de liquidation n'est simulé.
- La progression pédagogique est stockée localement dans le navigateur.
- Ne jamais committer de tokens, clés API, identifiants ou secrets.
- Le code prépare le SDK Telegram côté client; le bot et son URL seront configurés à la fin.

## Simulateur — état fonctionnel

- Positions fictives conservées localement, ouverture/fermeture et journal des trades.
- À la restauration, les données locales sont validées : position mal formée rejetée, entrées de journal invalides filtrées et historique limité aux 30 dernières opérations. En cas de session corrompue/version inconnue, retour à une session fictive de 100 € sans position.
- P&L pédagogique calculé à partir du prix visible; capital initial de démonstration 100 €.
- Import CSV OHLC : au moins 20 bougies, colonnes OHLC requises, valeurs numériques et cohérence high/low contrôlées. Si une colonne date/heure est fournie, chaque date doit être interprétable et strictement croissante, sans doublon.
- Replay pas-à-pas : les bougies sont révélées séquentiellement; aucune bougie future n'est utilisée pour le P&L affiché.

- Séparation des modes : l’import/replay est refusé tant qu’une position virtuelle est ouverte; les boutons d’ouverture/clôture sont suspendus pendant le replay. Un second CSV ne peut pas remplacer un replay actif. Quitter le replay restaure le graphique synthétique précédent. Les bougies importées ne sont pas conservées après rechargement de la page; l’historique est destiné à une session de démonstration.
- Tests automatiques couvrant l'import, les erreurs OHLC, les dates invalides, le replay et le P&L.

## Limites à garder en tête

Le simulateur reste un outil d'apprentissage : données importées par l'utilisateur ou synthétiques, sans flux de cotations garanti. Les coûts (spread, commissions, financement overnight et glissement) sont des hypothèses saisies dans un scénario, non des tarifs de marché vérifiés. Les calculs de marge et d'alerte de maintenance sont illustratifs; ils ne reproduisent pas les règles de liquidation d'un fournisseur. Pas de broker, de compte Revolut ou d'ordre réel. La connexion Telegram Mini App et son test sur iPhone restent une étape manuelle BotFather après confirmation de l'URL HTTPS publiée.
