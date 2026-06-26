# -*- encoding: utf-8 -*-

"""
Build HTML File from Jinja Templates for Permanent Redirect URLs
================================================================

Self-host, zero-cost URL redirects using **GitHub Pages** for explicit
use by https://github.com/typhed organization. Every single link is
rendered from a single TOML file, then a local Python builder environment
renders static redirect pages which is directly served.

The builder is configurable from the command line - the configuration
file, the Jinja template, and the output directory can each be overridden
via ``--config``, ``--template``, and ``--output`` respectively, all
defaulting to the project's standard layout.

:NOTE: The output directory is created if missing; existing files that
    are not generated from the configuration are left untouched.

.. versionchanged:: 2026-06-26 Add CLI Arguments And Split Project Layout
"""

import argparse
import pathlib
import tomllib
import urllib.parse

import jinja2

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent

DEFAULT_CONFIG = PROJECT_ROOT / "config" / "links.toml"
DEFAULT_TEMPLATE = PROJECT_ROOT / "src" / "templates" / "redirect.jinja"
DEFAULT_OUTPUT = PROJECT_ROOT / "dist"

def loadLinks(data : pathlib.Path) -> dict[str, dict[str, str]]:
    """
    Load the Redirect Definitions from a TOML Link Table

    Read the TOML configuration file and return its top-level ``links``
    table, a mapping of output filename to its redirect entry. Each entry
    carries a ``target`` URL and an optional ``label`` later consumed by
    the Jinja template.

    :type  data: pathlib.Path
    :param data: Path to the TOML file that declares the redirects under
        a top-level ``[links]`` table.

    :raises SystemExit: If the configuration file does not exist, or the
        loaded TOML document has no top-level ``links`` table.

    :rtype:   dict[str, dict[str, str]]
    :returns: The ``links`` table mapping each output filename to its
        redirect entry of string keys and values.
    """

    if not data.is_file():
        raise SystemExit(f"Fatal Error: TOML File is Missing: {data}")

    with data.open("rb") as handle:
        document = tomllib.load(handle)

    try:
        return document["links"]
    except KeyError:
        raise SystemExit(f"Fatal Error: TOML File has no [links] Table: {data}")


def main(
        links : dict[str, dict[str, str]],
        template : pathlib.Path, outpath : pathlib.Path
    ) -> bool:
    """
    Render the Static Redirect Pages from the Link Table

    Build a Jinja2 environment rooted at the template directory and render
    one self-contained HTML redirect page per entry in ``links``. Each
    target is validated as an absolute ``http``/``https`` URL before the
    page is written, and the output directory is created when missing.

    :type  links: dict[str, dict[str, str]]
    :param links: Mapping of output filename to its redirect entry, where
        each entry provides a ``target`` URL and an optional ``label``.

    :type  template: pathlib.Path
    :param template: Path to the Jinja redirect template; its parent
        directory is used as the template search path.

    :type  outpath: pathlib.Path
    :param outpath: Directory that receives the generated pages. It is
        created, with parents, when it does not already exist.

    :raises ValueError: If a target is not an absolute ``http`` or
        ``https`` URL with a network location.

    :rtype:   bool
    :returns: Always ``False`` so the caller can use the value as the
        process exit status (``0``) on success.
    """

    env = jinja2.Environment(
        loader = jinja2.FileSystemLoader(str(template.parent)),
        autoescape = jinja2.select_autoescape(("jinja", "html")),
        keep_trailing_newline = True
    )

    document = env.get_template(template.name)
    outpath.mkdir(parents = True, exist_ok = True)

    for filename, entry in links.items():
        target = entry["target"]
        parsed = urllib.parse.urlparse(target)

        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(
                f"Invalid Target: {filename!r}: {target!r}"
            )

        rendered = document.render(
            target = target, label = entry.get("label", "destination")
        )

        output = outpath / filename
        output.write_text(rendered, encoding = "utf-8", newline = "\n")

    return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description = "Render static redirect pages from a TOML link table."
    )

    parser.add_argument(
        "--config", type = pathlib.Path, default = DEFAULT_CONFIG,
        help = "Path to the TOML links file (default: config/links.toml)."
    )

    parser.add_argument(
        "--template", type = pathlib.Path, default = DEFAULT_TEMPLATE,
        help = "Path to the Jinja redirect template "
               "(default: src/templates/redirect.jinja)."
    )

    parser.add_argument(
        "--output", type = pathlib.Path, default = DEFAULT_OUTPUT,
        help = "Directory for the generated redirect pages (default: dist)."
    )

    arguments = parser.parse_args()

    config = arguments.config.resolve()
    template = arguments.template.resolve()
    output = arguments.output.resolve()

    # render toml file content, and return links
    links : dict[str, dict[str, str]] = loadLinks(data = config)

    raise SystemExit(main(
        links = links, template = template, outpath = output
    ))
