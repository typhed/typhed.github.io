# -*- encoding: utf-8 -*-

"""
Build HTML File from Jinja Templates for Permanent Redirect URLs
================================================================

Self-host, zero-cost URL redirects served as **Cloudflare Workers
static assets** for explicit use by https://github.com/typhed
organization. Every single link is rendered from a single TOML file,
then a local Python builder environment renders static redirect pages
which are directly served.

The builder is configurable from the command line - the configuration
file, the Jinja template, and the output directory can each be overridden
via ``--config``, ``--template``, and ``--output`` respectively, all
defaulting to the project's standard layout.

An optional ``--redirects`` file also receives every link as a
Cloudflare ``_redirects`` rule with status ``302``, written between
``# permalink:begin`` and ``# permalink:end`` marker lines. A key that
ends in ``.html`` is also matched by its stem, with and without a
trailing slash.

:NOTE: The output directory is created if missing; existing files that
    are not generated from the configuration are left untouched.

:NOTE: The ``_redirects`` block is replaced in place, or appended when
    absent, and every other line of the file is preserved, so running
    the builder again with the same links is a no-op.

.. versionchanged:: 2026-06-26 Add CLI Arguments And Split Project Layout
.. versionchanged:: 2026-11-17 Add Redirects Block And Key Validation
"""

import argparse
import pathlib
import re
import tomllib
import urllib.parse

import jinja2

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent

DEFAULT_CONFIG = PROJECT_ROOT / "config" / "links.toml"
DEFAULT_TEMPLATE = PROJECT_ROOT / "src" / "templates" / "redirect.jinja"
DEFAULT_OUTPUT = PROJECT_ROOT / "dist"

KEY_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*")

REDIRECTS_BEGIN = "# permalink:begin"
REDIRECTS_END = "# permalink:end"


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


def redirectRules(links : dict[str, dict[str, str]]) -> list[str]:
    """
    Build the Marker-Delimited Block of Cloudflare Redirect Rules

    Turn every entry in ``links`` into a Cloudflare ``_redirects``
    rule of the form ``/permalink/<key> <target> 302``. A key that
    ends in ``.html`` also gets a rule for its stem, with and without
    a trailing slash, so ``conduct.html``, ``conduct``, and
    ``conduct/`` all redirect. The rules sit between the begin and
    end marker lines that :func:`writeRedirects` looks for.

    :type  links: dict[str, dict[str, str]]
    :param links: Mapping of output filename to its redirect entry,
        where each entry provides a ``target`` URL.

    :rtype:   list[str]
    :returns: The block as lines without line endings, opening with
        the begin marker and closing with the end marker.
    """

    block = [REDIRECTS_BEGIN]
    for filename, entry in links.items():
        sources = [filename]
        if filename.endswith(".html"):
            stem = filename.removesuffix(".html")
            sources += [stem, f"{stem}/"]

        block += [
            f"/permalink/{source} {entry['target']} 302"
            for source in sources
        ]

    block.append(REDIRECTS_END)
    return block


def writeRedirects(
        links : dict[str, dict[str, str]], redirects : pathlib.Path
    ) -> None:
    """
    Merge the Permalink Block Into a Cloudflare Redirects File

    Replace the existing block of ``redirects`` in place with the one
    from :func:`redirectRules`, or append it when the file has none,
    and keep every other line as it is. A missing file is created with
    its parent directories. The file is written as UTF-8 with ``\\n``
    line endings, so a second run with the same links leaves it
    byte-identical.

    :type  links: dict[str, dict[str, str]]
    :param links: Mapping of output filename to its redirect entry,
        where each entry provides a ``target`` URL.

    :type  redirects: pathlib.Path
    :param redirects: Path to the Cloudflare ``_redirects`` file that
        receives the block.

    :raises ValueError: If the file holds a malformed block - a marker
        without its pair, an end marker before the begin marker, or
        more than one block. The file is left untouched in that case.
    """

    block = redirectRules(links)
    markers = (REDIRECTS_BEGIN, REDIRECTS_END)

    lines : list[str] = []
    if redirects.is_file():
        text = redirects.read_text(encoding = "utf-8")
        lines = text.removesuffix("\n").split("\n") if text else []

    found = [
        idx for idx, line in enumerate(lines)
        if line.strip() in markers
    ]

    if not found:
        lines += block
    elif tuple(lines[idx].strip() for idx in found) == markers:
        lines[found[0] : found[1] + 1] = block
    else:
        raise ValueError(
            f"Malformed Redirects Block: {redirects}: Expected One "
            f"{REDIRECTS_BEGIN!r} Line Before One {REDIRECTS_END!r}"
        )

    redirects.parent.mkdir(parents = True, exist_ok = True)
    redirects.write_text(
        "\n".join(lines) + "\n", encoding = "utf-8", newline = "\n"
    )


def main(
        links : dict[str, dict[str, str]],
        template : pathlib.Path, outpath : pathlib.Path,
        redirects : pathlib.Path | None = None
    ) -> bool:
    """
    Render the Static Redirect Pages from the Link Table

    Build a Jinja2 environment rooted at the template directory and render
    one self-contained HTML redirect page per entry in ``links``. Each
    target is validated as an absolute ``http``/``https`` URL before the
    page is written, and the output directory is created when missing.

    Every key is checked before anything is written: it must be one
    safe path segment matching ``[A-Za-z0-9][A-Za-z0-9._-]*``, so a
    path separator, ``..``, whitespace, or an empty key is rejected.
    The ``redirects`` file, when given, is written last, once every
    target has passed validation.

    :type  links: dict[str, dict[str, str]]
    :param links: Mapping of output filename to its redirect entry, where
        each entry provides a ``target`` URL and an optional ``label``.

    :type  template: pathlib.Path
    :param template: Path to the Jinja redirect template; its parent
        directory is used as the template search path.

    :type  outpath: pathlib.Path
    :param outpath: Directory that receives the generated pages. It is
        created, with parents, when it does not already exist.

    :type  redirects: pathlib.Path | None
    :param redirects: Optional Cloudflare ``_redirects`` file that
        receives the permalink block through :func:`writeRedirects`.
        The default ``None`` leaves every ``_redirects`` file alone.

    :raises ValueError: If a key is not one safe path segment, if a
        target is not an absolute ``http`` or ``https`` URL with a
        network location, or if ``redirects`` holds a malformed block.

    :rtype:   bool
    :returns: Always ``False`` so the caller can use the value as the
        process exit status (``0``) on success.
    """

    for filename in links:
        if not KEY_PATTERN.fullmatch(filename):
            raise ValueError(
                f"Invalid Key: {filename!r}: Not One Safe Path "
                f"Segment ({KEY_PATTERN.pattern})"
            )

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

    if redirects is not None:
        writeRedirects(links = links, redirects = redirects)

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

    parser.add_argument(
        "--redirects", type = pathlib.Path, default = None,
        help = "Cloudflare _redirects file that receives the "
               "permalink block (default: not written)."
    )

    arguments = parser.parse_args()

    config = arguments.config.resolve()
    template = arguments.template.resolve()
    output = arguments.output.resolve()

    redirects = arguments.redirects
    if redirects is not None:
        redirects = redirects.resolve()

    # render toml file content, and return links
    links : dict[str, dict[str, str]] = loadLinks(data = config)

    raise SystemExit(main(
        links = links, template = template, outpath = output,
        redirects = redirects
    ))
