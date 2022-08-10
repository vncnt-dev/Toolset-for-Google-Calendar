function preparePage() {
  /* let GCToolsMenue = document.createElement("button");
GCToolsMenue.type = "button";
GCToolsMenue.id = "GCToolsMenue";
GCToolsMenue.classList.add("btn", "btn-outline-secondary", "mx-4");
GCToolsMenue.innerText = "GCT Modus is deactive";
document.querySelector("div.BXL82c")!.after(GCToolsMenue);
 */

  // hoverover element in google calendar style
  let hoverElement: HTMLElement = document.createElement('div');
  hoverElement.innerHTML = `<span class="RM9ulf catR2e PgfOZ qs41qe" id="hoverInformationElement"> 
    <span class="AZnilc R8qYlc" id="hoverInformationElementText">Text</span>
    </span>`;
  document.getElementsByTagName('body')[0].appendChild(hoverElement);
}

export { preparePage };
