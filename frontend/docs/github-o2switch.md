# GitHub Actions → o2switch par FTPS

Le workflow .github/workflows/frontend-production.yml construit le frontend puis transfère le contenu de frontend/dist dans la racine web, sans API cPanel ni connexion SSH. o2switch prend en charge FTPS explicite sur le port 21 : https://faq.o2switch.fr/guides/configuration-logiciel/filezilla/.

## Configuration unique

1. Dans cPanel → Comptes FTP, créer un compte dédié dont le répertoire est exactement /home/noje1775/2dayna2day.com. Ce compte doit voir le frontend à la racine de sa connexion FTP ; ne pas lui donner accès au backend ou à tout le compte d'hébergement.
2. Dans le gestionnaire de fichiers cPanel, créer le fichier vide .2dayna2day-frontend dans ce dossier (activer l'affichage des fichiers cachés). Le transfert refuse une cible sans ce marqueur ou contenant WordPress.
3. Dans https://github.com/bassakirou/2dayna2day/settings/environments, ouvrir l'environnement production et ajouter ces trois secrets :

| Secret | Valeur |
| --- | --- |
| FTP_SERVER | whisper.o2switch.net (vérifier le nom fourni dans la configuration du compte FTP) |
| FTP_USERNAME | Identifiant complet du compte FTP dédié, fourni par cPanel |
| FTP_PASSWORD | Mot de passe du compte FTP dédié |

Ne pas transmettre le mot de passe dans le chat ou dans le dépôt. Il est stocké dans les secrets GitHub : https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets.

Les anciens secrets CPANEL_API_TOKEN, SSH_PRIVATE_KEY, SSH_KNOWN_HOSTS, CPANEL_SERVER, CPANEL_USERNAME et DEPLOY_PATH ne sont plus utilisés par ce workflow. Les anciens scripts SSH restent disponibles à titre d'archive et ne sont plus exécutés.

## Fonctionnement

- Un push modifiant le frontend sur main déclenche le build et le déploiement automatique.
- Une pull request effectue le build seulement, sans secrets FTP.
- Un lancement manuel sur main publie seulement si « Publier le frontend en production » est coché.
- npm ci, config:production, lint, typecheck et build:production doivent réussir avant le transfert.
- L'API de build est https://backoffice.2dayna2day.com. Elle doit répondre aux runners GitHub sans challenge navigateur.
- La connexion FTPS chiffre les identifiants et les fichiers ; le certificat serveur est vérifié.
- _next est envoyé avant les pages. Chaque fichier est envoyé sous un nom temporaire puis renommé, pour éviter de servir un fichier partiellement transféré. Le déploiement du site entier n'est pas atomique.
- .htaccess est inclus. Aucun ancien fichier n'est supprimé : les assets utilisés par des onglets ouverts restent disponibles. Les anciennes pages retirées peuvent donc subsister et nécessiter un nettoyage manuel ciblé.
- L'export exact du commit est conservé en artefact GitHub pendant 14 jours. Il peut être téléchargé pour réinstaller manuellement un export antérieur ; FTPS ne crée pas de sauvegarde automatique de l'état serveur.
- Un seul déploiement par branche est exécuté à la fois. Ne pas interrompre un transfert en cours.

Après configuration, lancer le workflow manuellement une première fois et vérifier /fr/, les styles, le panier et le checkout. Un build réussi seul ne confirme pas un transfert FTP réussi.

## État

Le workflow et le script FTPS sont préparés. Le transfert réel nécessite les trois secrets FTP et le compte restreint ci-dessus. Aucun transfert de production n'a été effectué pendant cette modification.
