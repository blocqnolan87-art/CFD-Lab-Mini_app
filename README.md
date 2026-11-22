CFD Lab — Mini-app pédagogique

Application web mobile-first en français, conçue pour être intégrée à Telegram Mini Apps. Elle contient une académie introductive, un simulateur à capital virtuel, un replay pédagogique, des quiz et une progression locale.

## Démarrage

Aucune compilation n'est nécessaire : servir la racine du dépôt via un hébergement HTTPS (GitHub Pages/Netlify), puis configurer cette URL dans Telegram BotFather à la dernière étape.

## Tests

Node.js 20+ : `npm test`

## Limites et sécurité

- Outil d'apprentissage, pas de conseil financier.
- Les cours de démonstration sont synthétiques tant qu'une source de données historique n'est pas raccordée et vérifiée.
- Capital et positions virtuels uniquement : aucune connexion broker/Revolut, aucune exécution d'ordre.
- Ne jamais ajouter de clés API, tokens Telegram ou secrets dans le dépôt.
- L'intégration Telegram côté client est préparée; l'association finale au bot se fera avec l'URL HTTPS publiée.
