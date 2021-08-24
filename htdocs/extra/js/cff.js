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

function switchOptions (id) {

	var selector   = document.getElementById(id);
	var item	   = selector.options[selector.selectedIndex].value;
	if (item == '') {
		document.getElementById('choix_cf').style.display		= 'block';
		document.getElementById('choix_dossier').style.display	= 'none';
	} else {
		document.getElementById('choix_cf').style.display		= 'none';
		document.getElementById('choix_dossier').style.display	= 'block';
	}
}

function toggleDiv (divid) {
	var mydiv = document.getElementById(divid); 
	if (mydiv.style.display == 'none') {
		mydiv.style.display = 'block';
	} else {
		mydiv.style.display = 'none';
	}
} 

//	-

function loadHTML (div_id, url) {
	var obj = new XMLHttpRequest();
	obj.open("GET", url);
	obj.send();
	obj.onreadystatechange=function() 
	{
	  if(obj.readyState==4) 
		document.getElementById(div_id).innerHTML = obj.responseText; 
		document.getElementById(div_id).style.display = 'block'; 
	}
}

//
function chkSelFond (id) {
	var sel = document.getElementById(id);
console.log('>> chkSelFond: '+id+'='+sel)
	if (sel === null) {
		return false;
	}
console.log('>> chkSelFond: '+id+'='+sel.options[sel.selectedIndex].value)
	if (sel.options[sel.selectedIndex].value == '') {
		alert('Please select a value');
		return false;
	}
	alert ('This will redirect you to the SBB/CFF web shop to continue tickets purchase');
	return true;
}
