"""Serve the included production build using only Python's standard library."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def send_head(self):
        requested = Path(self.translate_path(self.path))
        if not requested.is_file():
            self.path = "/index.html"
        return super().send_head()

    def log_message(self, format_string, *args):
        print("[ZedBiz] " + format_string % args)


def main():
    if not (DIST / "index.html").is_file():
        raise SystemExit("The included dist/index.html is missing. Rebuild the app or re-download the ZIP.")

    server = None
    for port in range(8000, 8010):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), SpaHandler)
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit("Ports 8000-8009 are busy. Close another local server and try again.")

    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"ZedBiz Lens is running at {url}")
    print("Keep this window open while using the demo. Press Ctrl+C to stop it.")
    threading.Timer(1.0, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping ZedBiz Lens preview.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
