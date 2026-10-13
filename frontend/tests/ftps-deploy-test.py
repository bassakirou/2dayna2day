import ftplib
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "deploy", Path(__file__).parents[1] / "scripts/deploy-o2switch-ftps.py")
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class FakeFTP:
    def __init__(self, marker=True, names=()):
        self.marker, self.names, self.uploads, self.renames = marker, names, [], []

    def retrbinary(self, command, callback):
        if not self.marker:
            raise ftplib.error_perm("550 missing marker")

    def nlst(self):
        return self.names

    def size(self, name):
        raise ftplib.error_perm("550 missing")

    def mkd(self, name):
        pass

    def storbinary(self, command, stream):
        self.uploads.append(command)
        stream.read()

    def rename(self, temporary, final):
        self.renames.append((temporary, final))


class DeployTest(unittest.TestCase):
    def test_assets_before_html_and_hidden_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("index.html", "fr/index.html", "_next/static/main.css", ".htaccess"):
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("test")
            ftp = FakeFTP()
            deploy.upload_export(ftp, root)
            self.assertEqual(ftp.renames[0][1], "_next/static/main.css")
            self.assertIn(".htaccess", [final for _, final in ftp.renames])
            self.assertTrue(all(temp.endswith(".2day-upload") for temp, _ in ftp.renames))

    def test_wrong_target_is_rejected_before_upload(self):
        for ftp in (FakeFTP(marker=False), FakeFTP(names=("wp-admin",))):
            with self.assertRaises((ftplib.error_perm, ValueError)):
                deploy.upload_export(ftp, Path("."))
            self.assertEqual(ftp.uploads, [])


if __name__ == "__main__":
    unittest.main()
