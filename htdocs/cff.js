var crtlayer = 1;

function ShowLayer(layerid) {
    var crtlayername= "Layer"+crtlayer;
    var layername   = "Layer"+layerid;
    document.getElementById(crtlayername).style.visibility='hidden';
    document.getElementById(layername).style.visibility='visible';
    crtlayer = layerid;
}

function showHelp (helpURL) 
{
  window.open(helpURL,'helpwindow','width=330,height=800,menubar=no,scrollbars=yes');
}
