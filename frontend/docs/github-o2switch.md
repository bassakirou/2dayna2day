# GitHub Actions → o2switch

Dépôt : https://github.com/bassakirou/2dayna2day ; branche `main`.

Cible confirmée par les captures cPanel du 11 octobre 2026 :

- Serveur : `whisper.o2switch.net`
- Identifiant : `noje1775`
- Racine frontend : `/home/noje1775/2dayna2day.goldenbackapparel.com`
- Marqueur à créer : `/home/noje1775/2dayna2day.goldenbackapparel.com/.2dayna2day-frontend`

Le dossier frontend est directement sous `/home/noje1775`, distinct de `public_html` et du dossier `admin2dayna2day.goldenbackapparel.com`. La configuration du workflow reste fournie par les secrets GitHub pour éviter toute cible implicite.
Organisation à la racine : `.github/workflows/`, `frontend/`, `.gitignore`, `.gitattributes`. Le backend et les rapports locaux sont exclus. Ce dépôt étant public, vérifier les fichiers sélectionnés avant chaque commit ; ne jamais envoyer wp-config.php, une base SQL ou des clés privées.

## Fonctionnement

Un push sur main ou une pull request lance npm ci, la validation de configuration, ESLint, TypeScript et le build public avec Node 22. L'export est conservé dans les artefacts GitHub pendant 14 jours. Les pull requests n'ont pas accès aux secrets de déploiement.

Pour publier : GitHub → Actions → Frontend production o2switch → Run workflow → branche main → cocher « Publier le frontend en production ». Sans cette case, seul le build est exécuté. Le workflow reconstruit et publie exactement le commit sélectionné ; il ne récupère pas un ancien dist de l'ordinateur. Un push ne publie pas automatiquement, adapté au lancement pendant que les tests métier restent à terminer.

Le job de publication utilise l'environnement `production`, une clé SSH et rsync. Il autorise temporairement l'IPv4 du runner via l'API cPanel, puis retire uniquement les exceptions qu'il a créées (in et out). Il ne supprime pas les autres IP autorisées. Si GitHub interrompt brutalement le runner, vérifier les exceptions dans cPanel ; une annulation brutale peut empêcher le nettoyage.

## Configuration unique dans o2switch

1. Utiliser la racine frontend confirmée : `/home/noje1775/2dayna2day.goldenbackapparel.com`. Ne pas utiliser `public_html` ou le dossier backend. Le serveur cPanel / SSH est `whisper.o2switch.net`.
2. Ouvrir l'accès SSH pour votre ordinateur dans Autorisation SSH. Créer une paire de clés dédiée au déploiement et autoriser sa clé publique dans cPanel → Accès SSH. La clé privée dédiée doit être utilisable sans saisie interactive ; conserver votre clé personnelle séparément.
3. Créer dans la racine frontend un fichier vide ou un dossier `.2dayna2day-frontend`. Le dossier déjà créé convient. Ce marqueur explicite est obligatoire : le script refuse toute cible sans marqueur, les chemins non canoniques et les dossiers contenant WordPress.
4. Créer un jeton API cPanel pour la gestion de l'autorisation SSH, sans le stocker dans le dépôt.
5. Obtenir les lignes known_hosts du serveur avec `ssh-keyscan -p 22 whisper.o2switch.net`. Vérifier leur empreinte par une source fiable (connexion SSH déjà vérifiée ou support o2switch) avant de les enregistrer. Le workflow refuse une clé serveur inconnue ou différente.

## Configuration dans GitHub

Dans Settings → Environments, créer `production` et autoriser seulement `main` si cette option est disponible. Les règles d'approbation supplémentaires dépendent du forfait GitHub.

Ajouter les secrets suivants à l'environnement production :

| Secret | Valeur |
| --- | --- |
| CPANEL_SERVER | `whisper.o2switch.net` |
| CPANEL_USERNAME | `noje1775` |
| CPANEL_API_TOKEN | Jeton API cPanel pour la liste blanche SSH |
| SSH_PRIVATE_KEY | Contenu complet de la clé privée dédiée |
| SSH_KNOWN_HOSTS | Lignes known_hosts du serveur, empreinte vérifiée |
| DEPLOY_PATH | `/home/noje1775/2dayna2day.goldenbackapparel.com` |

Ne transmettre aucun de ces secrets dans le chat. Les deux URLs WordPress sont publiques et définies explicitement dans le job de build ; aucun secret cPanel ou SSH n'est transmis à npm ou inclus dans dist.

## Dépôt local et prochaines mises à jour

Le premier envoi est effectué. Le dossier de travail `C:/Users/Jean Marc bassahak/Documents/trae_projects/2dayna2day` est maintenant un dépôt Git sur main, relié à origin/main. L'historique distant et son README ont été conservés. Le dossier `.deployment-staging` était une copie de préparation et est ignoré ; travailler depuis le dossier habituel.

Pour une mise à jour : vérifier `git status`, sélectionner les changements avec `git add frontend .github`, vérifier `git diff --cached`, puis `git commit -m "Description de la modification"` et `git push`. Les dossiers backend, exports et dépendances restent ignorés. Le push construit seulement ; publier ensuite explicitement depuis Actions après réussite.

Le workflow doit être placé à la racine du dépôt, pas dans frontend/.github. Il attend frontend/package.json et frontend/package-lock.json.

## Transfert, sauvegarde et limites

Avant toute copie, le script sauvegarde le contenu du dossier web dans `~/2dayna2day-backups/frontend-RUN_ID-RUN_ATTEMPT.tar.gz`, hors du site. Ensuite il transfère `_next` avant les autres fichiers, et conserve les fichiers existants et `.htaccess`. Aucun rsync --delete n'est utilisé. Cela conserve les anciens assets pour les onglets ouverts ; les routes supprimées du code peuvent rester accessibles et devront être nettoyées explicitement après validation.

Le transfert n'est pas une bascule atomique : une courte période avec des pages de versions différentes reste possible. Une erreur après le début du transfert peut laisser une publication partielle. Le workflow ne restaure pas automatiquement ; la sauvegarde permet une restauration supervisée. Ne pas automatiser un nettoyage ou une restauration sans vérifier le chemin frontend et les fichiers à conserver. Les sauvegardes s'accumulent : prévoir une rotation après les premières publications validées.

Le contrôle final vérifie uniquement que /fr/ répond avec du HTML. Il ne garantit pas le fonctionnement du panier, de l'authentification ou du paiement : tester ces parcours après publication. Si Tiger Protect bloque les runners GitHub sur REST/GraphQL, le build échoue avant toute copie.

## Références

- API d'autorisation SSH o2switch : https://faq.o2switch.fr/cpanel/outils/exception-parefeu/
- Environnements GitHub : https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments

Configuration via gh : environnement production et secrets CPANEL_SERVER, CPANEL_USERNAME, DEPLOY_PATH, SSH_PRIVATE_KEY enregistrés. Clé dédiée locale : `C:/Users/Jean Marc bassahak/.ssh/2dayna2day-github-actions` ; importer uniquement le fichier `.pub` dans cPanel → Accès SSH → Gérer les clés SSH → Importer une clé, puis autoriser cette clé publique.

Restent CPANEL_API_TOKEN et SSH_KNOWN_HOSTS à enregistrer après création du jeton et vérification de l'empreinte serveur. Pour saisir le jeton sans l'afficher : `gh secret set CPANEL_API_TOKEN --repo bassakirou/2dayna2day --env production` (saisie interactive). Ne pas copier la clé privée dans le dépôt ou dans le chat. Aucun déploiement n'a été déclenché pendant cette configuration.
