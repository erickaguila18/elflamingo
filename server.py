"""Servidor estático para la SPA. Uso: python3 server.py [puerto]"""
import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent / "public"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main(port: int = 8000) -> None:
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("0.0.0.0", port), handler) as srv:
        print(f"El Flamingo en http://localhost:{port}  (Ctrl+C para salir)")
        srv.serve_forever()


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
