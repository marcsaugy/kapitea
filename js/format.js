// Formatage des montants — référence unique pour tout le site.
// Convention suisse : apostrophe comme séparateur de milliers, CHF en préfixe.
// Intl.NumberFormat('fr-CH') produit « 400 000 CHF » (espace insécable, suffixe),
// ce qui n'est pas la convention retenue.

function formatCHF(value) {
  return 'CHF ' + formatAmount(value);
}

// Nombre seul, sans devise (axes de graphique, champs)
function formatAmount(value) {
  const rounded = Math.round(Number(value) || 0);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}
