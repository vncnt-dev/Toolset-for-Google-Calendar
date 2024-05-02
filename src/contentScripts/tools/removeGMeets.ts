// gcal might delete the elements, so we need to store them to access them later and re-add them

function removeGMeets() {
  const detailsPageElement = document.querySelector('.ewPPR');
  const quickAddElement = document.querySelector('.VuEIfc');

  if (detailsPageElement) {
    document.querySelector('.Kh5Sib.FAE19b')?.closest('.FrSOzf')?.remove();
  } else if (quickAddElement) {
    document.querySelector('.m2hqkd')?.remove();
  } else {
    return;
  }
}

export { removeGMeets };
