# Transforme les photos de polycopiés déposées dans Cours/ (JPG, PNG) en PDF façon scan :
# détection de la page, redressement, mise en portrait, fond blanchi, A4 à 200 dpi.
# Les photos d'origine sont rangées dans Cours/photos/ (non suivi par Git).
#
# Usage : python outils/scanner.py --apercu [réglages]   PDF + planche de contrôle dans un dossier temporaire
#         python outils/scanner.py [réglages]            PDF écrits dans Cours/, photos déplacées
# Réglages, un par photo à corriger (nom sans extension) :
#   NOM=Q        Q quarts de tour horaires (par défaut 1 si la page est en paysage : sens à vérifier sur la planche)
#   NOM=Q:plein  idem, sans recadrage (quand la page déborde de la photo ou que d'autres feuilles gênent)
import sys, os, glob, shutil, tempfile, cv2, numpy as np
from PIL import Image, ImageOps, ImageDraw

racine = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
cours = os.path.join(racine, 'Cours')
apercu = '--apercu' in sys.argv
rot, plein = {}, set()
for a in sys.argv[1:]:
    if a.startswith('--'): continue
    n, q = a.split('='); q, _, opt = q.partition(':'); rot[n] = int(q)
    if opt == 'plein': plein.add(n)

# Coins dans l'ordre : haut-gauche, haut-droit, bas-droit, bas-gauche.
def ordonne(p):
    p = p.reshape(4, 2).astype('float32'); s = p.sum(1); d = np.diff(p, axis=1).ravel()
    return np.array([p[s.argmin()], p[d.argmin()], p[s.argmax()], p[d.argmax()]], dtype='float32')

# Contour de la feuille (la plus grande zone claire), ou None.
def page(img):
    h, w = img.shape[:2]; k = 1000 / max(h, w)
    g = cv2.cvtColor(cv2.resize(img, None, fx=k, fy=k), cv2.COLOR_BGR2GRAY)
    g = cv2.GaussianBlur(g, (7, 7), 0)
    _, b = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs: return None
    c = max(cs, key=cv2.contourArea)
    if cv2.contourArea(c) < 0.35 * g.size: return None
    a = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
    if len(a) != 4: a = cv2.boxPoints(cv2.minAreaRect(c))
    return ordonne(a) / k

def scanner(f):
    nom = os.path.splitext(os.path.basename(f))[0]
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    img = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    q = None if nom in plein else page(img)
    etat = 'page détectée' if q is not None else 'image entière'
    if q is not None:
        tl, tr, br, bl = q
        W = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl))); H = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
        if not 1.3 < max(W, H) / min(W, H) < 1.52: q = None; etat = 'contour non A4, image entière'
    if q is not None:
        M = cv2.getPerspectiveTransform(q, np.array([[0, 0], [W, 0], [W, H], [0, H]], dtype='float32'))
        img = cv2.warpPerspective(img, M, (W, H))
    n = rot.get(nom, 1 if img.shape[1] > img.shape[0] else 0)
    for _ in range(n % 4): img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    # Fond blanchi par division par le fond flouté (garde les surlignages en couleur).
    fond = cv2.GaussianBlur(cv2.dilate(img, np.ones((9, 9), np.uint8)), (0, 0), 25)
    img = cv2.convertScaleAbs(cv2.divide(img, fond, scale=255), alpha=1.15, beta=-25)
    h, w = img.shape[:2]
    img = cv2.resize(img, (1654, int(h * 1654 / w)), interpolation=cv2.INTER_AREA)
    print(nom + ' : ' + etat + ', ' + str(n) + ' quart(s) de tour')
    return nom, Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

photos = sorted(f for f in glob.glob(os.path.join(cours, '*')) if os.path.splitext(f)[1].lower() in ('.jpg', '.jpeg', '.png'))
if not photos: print('Aucune photo dans Cours/.'); sys.exit(0)
sortie = tempfile.mkdtemp(prefix='scans-') if apercu else cours
vignettes = []
for f in photos:
    nom, page_ = scanner(f)
    page_.save(os.path.join(sortie, nom + '.pdf'), 'PDF', resolution=200, quality=80)
    vignettes.append((nom, page_.resize((330, int(page_.height * 330 / page_.width)))))

if apercu:
    h = max(v.height for _, v in vignettes); lignes = (len(vignettes) + 4) // 5
    planche = Image.new('RGB', (330 * 5, (h + 20) * lignes), 'gray'); d = ImageDraw.Draw(planche)
    for k, (nom, v) in enumerate(vignettes):
        x, y = (k % 5) * 330, (k // 5) * (h + 20); planche.paste(v, (x, y + 20)); d.text((x + 4, y + 4), nom, fill='white')
    planche.save(os.path.join(sortie, 'planche.png'))
    print('Planche de contrôle : ' + os.path.join(sortie, 'planche.png'))
else:
    os.makedirs(os.path.join(cours, 'photos'), exist_ok=True)
    for f in photos: shutil.move(f, os.path.join(cours, 'photos', os.path.basename(f)))
    print(str(len(photos)) + ' PDF écrits dans Cours/, photos d\'origine rangées dans Cours/photos/.')
