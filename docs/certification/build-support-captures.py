"""Construit StockFlow-Bloc3-captures.pptx : slide 7 bis « les outils en vrai ».

Insère une slide après la 7, avec la capture du board et celle des runs CI,
puis renumérote les pieds de page de /24 en /25. L'original n'est pas touché.
"""

import re
import shutil
import zipfile
from pathlib import Path

SUPPORT = Path.home() / "Downloads/StockFlow-Bloc3/1-support"
CAPTURES = Path.home() / "Downloads/StockFlow-Bloc3/captures-outils"
SRC = SUPPORT / "StockFlow-Bloc3.pptx"
DST = SUPPORT / "StockFlow-Bloc3-captures.pptx"

BOARD = CAPTURES / "board-tableau-crop.png"      # 1600 x 1408
CI = CAPTURES / "ci-actions-crop.png"            # 1095 x 1535

NEW_POS = 8       # position de la nouvelle slide dans le déroulé
TOTAL = 25        # nombre de slides après insertion


def shapes(xml):
    """Découpe le spTree en blocs <p:sp>…</p:sp> de premier niveau."""
    out, depth, start = [], 0, None
    for m in re.finditer(r"<p:sp>|</p:sp>", xml):
        if m.group() == "<p:sp>":
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(xml[start : m.end()])
    return out


def set_text(sp, new):
    """Remplace le texte du premier run d'une forme."""
    return re.sub(r"(<a:t>)[^<]*(</a:t>)", lambda m: m.group(1) + new + m.group(2), sp, count=1)


def fit(iw, ih, box_x, box_y, box_w, box_h):
    """Homothétie dans la boîte, centrée horizontalement, calée en haut."""
    s = min(box_w / iw, box_h / ih)
    w, h = int(iw * s), int(ih * s)
    return box_x + (box_w - w) // 2, box_y, w, h


def pic(pid, name, rid, x, y, cx, cy):
    return (
        f'<p:pic><p:nvPicPr><p:cNvPr id="{pid}" name="{name}"/>'
        '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
        f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        '<a:ln w="12700"><a:solidFill><a:srgbClr val="D9DEE5"/></a:solidFill></a:ln>'
        "</p:spPr></p:pic>"
    )


def textbox(pid, name, x, y, cx, cy, runs, size=1000, bold=0, color="1A2230", spc=0):
    body = "".join(
        f'<a:r><a:rPr lang="fr-FR" sz="{size}" b="{bold}" spc="{spc}" kern="0" dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        '<a:latin typeface="Calibri" pitchFamily="34" charset="0"/>'
        '<a:ea typeface="Calibri" pitchFamily="34" charset="-122"/>'
        '<a:cs typeface="Calibri" pitchFamily="34" charset="-120"/>'
        f"</a:rPr><a:t>{t}</a:t></a:r>"
        for t in runs
    )
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{pid}" name="{name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln/></p:spPr>'
        '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"/>'
        f'<a:lstStyle/><a:p><a:pPr indent="0" marL="0"><a:buNone/></a:pPr>{body}'
        f'<a:endParaRPr lang="fr-FR" sz="{size}" dirty="0"/></a:p></p:txBody></p:sp>'
    )


def build_slide(slide7):
    chrome = shapes(slide7)[:8]  # bandeau, surtitre, titre, filet, sous-titre, pied
    chrome[2] = set_text(chrome[2], "Ces outils, tels qu&apos;un tiers les voit")
    chrome[4] = set_text(chrome[4], "C3.2.1 — Outil de suivi de projet · PREUVES D&apos;EXÉCUTION")
    chrome[7] = set_text(chrome[7], f"{NEW_POS} / {TOTAL}")

    bx, by, bw, bh = fit(1600, 1408, 566928, 1800000, 5413248, 3700000)
    cx_, cy_, cw, ch = fit(1095, 1535, 6217920, 1800000, 5413248, 3700000)

    body = [
        textbox(
            60, "Kicker", 566928, 1470000, 11064240, 256032,
            ["CAPTURES PRISES SANS ÊTRE CONNECTÉ — N&apos;IMPORTE QUI PEUT LES REFAIRE"],
            size=1150, bold=1, color="C75D2C", spc=100,
        ),
        pic(61, "Board GitHub Projects", "rIdImg1", bx, by, bw, bh),
        pic(62, "Runs CI juillet", "rIdImg2", cx_, cy_, cw, ch),
        textbox(
            63, "Legende board", 566928, 5620000, 5413248, 700000,
            ["Board projects/3, vue tableau. 31 fiches — quatre portent « Accepté (risque documenté) », "
             "ce sont les points de vigilance V2, V11, V12 et V13 du registre."],
            size=1000,
        ),
        textbox(
            64, "Legende CI", 6217920, 5620000, 5413248, 700000,
            ["Actions, filtré du 3 au 13 juillet. Rouge du 4 au 12 — les runs des 4 et 6 sont en "
             "page 2 — puis vert à partir de fix(ci) #24, le 12 au soir. C&apos;est l&apos;incident #26."],
            size=1000,
        ),
    ]

    head = slide7[: slide7.index("<p:sp>")]
    tail = "</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>"
    return head + "".join(chrome) + "".join(body) + tail


# l'axe du rétroplanning : trait du 1er juin en x=3958690, un jour = 59857 EMU
# (vérifié sur le jalon J1 du 12 juin, posé à x=4617118)
JOUR = 59857
JUIL_1 = 5754403
VERSIONS = [("v0.2.0", 3), ("v0.3.0", 4), ("v0.4.0", 13)]


def patch_retroplanning(xml):
    """Pose les trois versions taguées sur l'axe de la slide 4."""
    marques = "".join(
        f'<p:sp><p:nvSpPr><p:cNvPr id="{90 + i}" name="Tag {nom}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{JUIL_1 + (jour - 1) * JOUR}" y="4173728"/>'
        '<a:ext cx="18288" cy="137160"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        '<a:solidFill><a:srgbClr val="C75D2C"/></a:solidFill><a:ln/></p:spPr></p:sp>'
        for i, (nom, jour) in enumerate(VERSIONS)
    )
    # la marge de gauche est la seule bande qui ne croise aucun trait vertical
    legende = textbox(
        95, "Legende versions", 566928, 4173728, 1500000, 137160,
        ["3 VERSIONS TAGUÉES"], size=800, bold=1, color="C75D2C", spc=60,
    )
    return xml.replace("</p:spTree>", marques + legende + "</p:spTree>")


def patch_conformite(xml):
    """Ajoute les audits à la case « ce qui a été mesuré » de la slide 22."""
    avant = ("<a:t>36 recettes sur 36, 99 tests verts — de la conformité livrée, "
             "pas de la satisfaction.</a:t>")
    apres = ("<a:t>36 recettes sur 36, 99 tests verts, audit RGAA outillé (3 violations "
             "corrigées), OWASP Top 10 passé en revue — de la conformité, pas de la "
             "satisfaction.</a:t>")
    assert avant in xml, "libellé de conformité introuvable"
    xml = xml.replace(avant, apres)
    # deux lignes au lieu d'une : la case et les deux cartes gagnent la hauteur qu'il faut,
    # sans mordre sur le bandeau du bas qui commence à 5760720
    xml = xml.replace('<a:off x="768096" y="5248656"/><a:ext cx="5010912" cy="182880"/>',
                      '<a:off x="768096" y="5248656"/><a:ext cx="5010912" cy="457200"/>')
    return xml.replace('<a:ext cx="5413248" cy="932688"/>', '<a:ext cx="5413248" cy="1005840"/>')


def renumber(xml, old, new):
    return xml.replace(f"<a:t>{old} / 24</a:t>", f"<a:t>{new} / {TOTAL}</a:t>")


def main():
    zin = zipfile.ZipFile(SRC)
    slide7 = zin.read("ppt/slides/slide7.xml").decode("utf-8")
    new_slide = build_slide(slide7)

    if DST.exists():
        DST.unlink()
    zout = zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED)

    for item in zin.infolist():
        data = zin.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m:
            n = int(m.group(1))
            xml = data.decode("utf-8")
            xml = renumber(xml, n, n if n < NEW_POS else n + 1)
            if n == 4:
                xml = patch_retroplanning(xml)
            if n == 22:
                xml = patch_conformite(xml)
            if n == 7:
                # le board porte 31 des 32 issues : #3 est antérieure à sa création
                xml = xml.replace("<a:t>32 issues — la file de travail.</a:t>",
                                  "<a:t>31 des 32 issues — la file de travail.</a:t>")
                assert "31 des 32 issues" in xml, "libellé du board introuvable sur la slide 7"
            data = xml.encode("utf-8")

        elif item.filename == "ppt/presentation.xml":
            xml = data.decode("utf-8")
            anchor = '<p:sldId id="262" r:id="rId8"/>'
            assert anchor in xml, "ancre slide 7 introuvable"
            xml = xml.replace(anchor, anchor + '<p:sldId id="280" r:id="rId100"/>')
            data = xml.encode("utf-8")

        elif item.filename == "ppt/_rels/presentation.xml.rels":
            xml = data.decode("utf-8")
            xml = xml.replace(
                "</Relationships>",
                '<Relationship Id="rId100" Type="http://schemas.openxmlformats.org/'
                'officeDocument/2006/relationships/slide" Target="slides/slide25.xml"/>'
                "</Relationships>",
            )
            data = xml.encode("utf-8")

        elif item.filename == "[Content_Types].xml":
            xml = data.decode("utf-8")
            xml = xml.replace(
                "</Types>",
                '<Override PartName="/ppt/slides/slide25.xml" ContentType="application/vnd.'
                'openxmlformats-officedocument.presentationml.slide+xml"/></Types>',
            )
            data = xml.encode("utf-8")

        zout.writestr(item, data)

    zout.writestr("ppt/slides/slide25.xml", new_slide.encode("utf-8"))
    zout.writestr(
        "ppt/slides/_rels/slide25.xml.rels",
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
        'relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        '<Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
        'relationships/image" Target="../media/board-tableau.png"/>'
        '<Relationship Id="rIdImg2" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
        'relationships/image" Target="../media/ci-actions.png"/></Relationships>',
    )
    zout.writestr("ppt/media/board-tableau.png", BOARD.read_bytes())
    zout.writestr("ppt/media/ci-actions.png", CI.read_bytes())
    zout.close()

    # le fichier doit être un XML valide et s'ouvrir comme un pptx cohérent
    from xml.dom import minidom

    check = zipfile.ZipFile(DST)
    for name in check.namelist():
        if name.endswith((".xml", ".rels")):
            minidom.parseString(check.read(name))
    print("slides:", len([n for n in check.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]))
    print("ok:", DST)


if __name__ == "__main__":
    main()
