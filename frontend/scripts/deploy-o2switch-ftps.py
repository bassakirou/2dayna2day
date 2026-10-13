"""Upload a static export through explicit FTPS, without cPanel API or SSH."""
import ftplib
import os
from pathlib import Path
import ssl
import sys
import urllib.request


def upload_export(ftp, directory):
    # The account must be jailed to the frontend document root. A marker prevents
    # uploading into a fresh/wrong account or the WordPress document root.
    ftp.retrbinary("RETR .2dayna2day-frontend", lambda _: None)
    names = {name.rstrip('/').split('/')[-1] for name in ftp.nlst()}
    if names.intersection({"wp-config.php", "wp-admin"}):
        raise ValueError("La cible contient WordPress : transfert refusé")
    for forbidden in ("wp-config.php", "wp-admin"):
        try:
            ftp.size(forbidden)
        except ftplib.error_perm as error:
            if not str(error).startswith("550"):
                raise
        else:
            raise ValueError("La cible contient WordPress : transfert refusé")
    files = sorted(directory.rglob("*"))
    files = [file for file in files if file.is_file()]
    files.sort(key=lambda file: (
        0 if file.relative_to(directory).parts[0] == "_next" else
        2 if file.suffix in (".html", ".txt") else 1,
        file.relative_to(directory).as_posix(),
    ))
    created = set()
    for file in files:
        relative = file.relative_to(directory)
        parent = Path()
        for part in relative.parts[:-1]:
            parent /= part
            remote_directory = parent.as_posix()
            if remote_directory not in created:
                try:
                    ftp.mkd(remote_directory)
                except ftplib.error_perm as error:
                    if not str(error).startswith("550"):
                        raise
                    # A permission error is not proof that the directory exists.
                    current = ftp.pwd()
                    ftp.cwd(remote_directory)
                    ftp.cwd(current)
                created.add(remote_directory)
        remote = relative.as_posix()
        temporary = remote + ".2day-upload"
        with file.open("rb") as stream:
            ftp.storbinary("STOR " + temporary, stream)
        ftp.rename(temporary, remote)
    print(f"Transfert FTPS terminé : {len(files)} fichiers. Aucun ancien fichier supprimé.")


def main():
    values = {key: os.environ.get(key, "") for key in
              ("FTP_SERVER", "FTP_USERNAME", "FTP_PASSWORD")}
    if not all(values.values()):
        raise ValueError("Configurer FTP_SERVER, FTP_USERNAME et FTP_PASSWORD dans production")
    directory = Path("frontend/dist")
    if not (directory / "index.html").is_file() or not (directory / "_next/static").is_dir():
        raise ValueError("Export de production incomplet")
    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=60) as ftp:
        ftp.connect(values["FTP_SERVER"], 21)
        ftp.login(values["FTP_USERNAME"], values["FTP_PASSWORD"])
        ftp.prot_p()  # Encrypt both credentials and transferred content.
        ftp.set_pasv(True)
        upload_export(ftp, directory)
    url = "https://2dayna2day.com/fr/"
    with urllib.request.urlopen(url, timeout=30) as response:
        if b"<html" not in response.read().lower():
            raise ValueError("La vérification de la page publique a échoué")
    print("Page publique accessible ; vérifier aussi les parcours métier.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Never print FTP credentials, including in server error messages.
        message = str(error)
        for key in ("FTP_PASSWORD", "FTP_USERNAME"):
            secret = os.environ.get(key)
            if secret:
                message = message.replace(secret, "[masqué]")
        print("Déploiement FTPS échoué : " + message, file=sys.stderr)
        sys.exit(1)
