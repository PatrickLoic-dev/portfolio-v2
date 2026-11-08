## Le problème du double tap

Sur la fibre, une requête de paiement revient en quelques centaines de millisecondes. Sur un réseau mobile saturé à l'étranger, elle peut rester bloquée dix secondes, assez pour qu'un utilisateur inquiet appuie à nouveau sur « Envoyer », ou que l'app relance d'elle-même.

Sans protection, les deux requêtes atteignent l'API. Les deux semblent valides. Les deux déplacent de l'argent.

## Des clés, pas de l'espoir

La solution : une `Idempotency-Key`, un identifiant unique que le client génère une seule fois par intention de virement et envoie à chaque tentative. Le serveur enregistre le premier résultat sous cette clé et le rejoue simplement pour toute répétition.

```ts title="transfer.service.ts"
const key = crypto.randomUUID();

return this.http.post<TransferResult>(
  '/transfers', payload,
  { headers: { 'Idempotency-Key': key } }
).pipe(retry({ count: 3, delay: backoff }));
```

Comme la clé est créée avant la première tentative, chaque retry (automatique ou humain) porte la même identité.

> Un retry ne devrait jamais être une nouvelle décision. C'est la même décision, posée une seconde fois.

## Typer le contrat

Partager les types de requête et de réponse entre Angular et NestJS a fait qu'un champ renommé cassait le build plutôt qu'un virement. Cela a aussi rendu les états explicites :

- **pending** : accepté, pas encore réglé
- **completed** : l'argent a bougé, on affiche le reçu
- **rejected** : rien n'a bougé, on peut réessayer sans risque

## Ce que voit l'utilisateur

Le bouton se verrouille dès qu'on appuie dessus, et une réponse lente affiche « Envoi en cours, ne fermez pas cette page » au lieu d'un spinner qui semble figé.

> [!TIP]
> Astuce : journalisez la clé d'idempotence avec chaque rapport d'erreur. Le support peut alors répondre à « est-ce que c'est passé ? » en quelques secondes.

## À retenir

- Générez la clé une fois par intention, avant la première tentative.
- Typez les états que vous montrez aux utilisateurs, pas seulement les payloads.
- Soignez le chemin lent : c'est celui dont vos utilisateurs se souviendront.
