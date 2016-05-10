var phase=1;
var subphase=0;
var round=1;
var skillturn=0;
var tabskill;
var VERSION="v0.8.7";
var LANG="en";
var DECLOAK_PHASE=1;
var SETUP_PHASE=2,PLANNING_PHASE=3,ACTIVATION_PHASE=4,COMBAT_PHASE=5,SELECT_PHASE=1,CREATION_PHASE=6,XP_PHASE=7;
var DICES=["focusred","hitred","criticalred","blankred","focusgreen","evadegreen","blankgreen"];
var BOMBS=[];
var ROCKDATA="";
var allunits=[];
var PILOT_translation,SHIP_translation,CRIT_translation,UI_translation,UPGRADE_translation,PILOT_dict,UPGRADE_dict;
var actionr=[];
var actionrlock;
var HISTORY=[];
var replayid=0;
var dice=1;
var ATTACK=[]
var DEFENSE=[]
var SEARCHINGSQUAD;
var FACTIONS={"rebel":"REBEL","empire":"EMPIRE","scum":"SCUM"};
var SQUADLIST,SQUADBATTLE;
var COMBATLIST;
var combatpilots=[];
var TEAMS=[new Team(0),new Team(1),new Team(2)];
var currentteam=TEAMS[0];
var VIEWPORT;
var ANIM="";
var SETUP;
var SHOWDIAL=[];
var TRACE=false;
var TEMPLATES={"bomb":"","upgrade":"","weapon":""};
//var sl;
var increment=1;
var theta=0;
var UNIQUE=[];
var stype="";
var REPLAY="";
var PERMALINK="";
/*

    <script src="src/obstacles.js"></script>
    <script src="src/critical.js"></script>
    <script src="src/units.js"></script>
    <script src="src/iaunits.js"></script>
    <script src="src/pilots.js"></script>
    <script src="src/upgrades.js"></script>
    <script src="src/upgcards.js"></script>
    <script src="src/team.js"></script>
    <script src="src/xwings.js"></script>

		 <button onclick='$("#replay")[0].contentWindow.stopreplay();'>Stop</button>

*/
window.callback = function () { alert("called callback");return true; };
/*window.onerror = function(message, source, lineno, colno, error) {
    log("<b>ERROR: "+error+"</b>");
 };
*/
var SETUPS={
    "playzone":"M 0 0 L 900 0 900 900 0 900 Z",
    "zone1":"M 0 0 L 100 0 100 900 0 900 Z",
    "zone2":"M 800 0 L 900 0 900 900 800 900 Z",
    "asteroids":6,
     "Classic Map": {
	"name":"Classic",
	"background":"css/playmat10.jpg",
    },
    "Cloud City Map": {
	"name":"Cloud City",
	"background":"css/playmat6.jpg",
    },
    "Blue Sky Map": {
	"name":"Blue Sky",
	"background":"css/playmat13.jpg",
    },
    "Blue Planet Map": {
	"name":"Blue Planet",
	"background":"css/playmat11.jpg",
    },
    "Mars Map": {
	"name":"Mars",
	"background":"css/playmat14.jpg",
    }
}


function center() {
    var bbox=activeunit.g.getBBox();
    var xx=(bbox.x+bbox.width/2);
    var yy=(bbox.y+bbox.height/2)
    var w=$("#svgout").width();
    var h=$("#svgout").height();
    var startX=0;
    var startY=0;
    if (h>w) startY=(h-w)/2;
    else startX=(w-h)/2;
    var min=Math.min(w/900.,h/900.);
    var x=startX+VIEWPORT.m.x(xx,yy)*min;
    var y=startY+VIEWPORT.m.y(xx,yy)*min
    var mm=VIEWPORT.m.invert();
    if (x<0||x>w) VIEWPORT.m=MT((-x+w/2-startX)/min,0).add(VIEWPORT.m);
    if (y<0||y>h) VIEWPORT.m=MT(0,(-y+h/2-startY)/min).add(VIEWPORT.m);

    VIEWPORT.transform(VIEWPORT.m);
    activeunit.show();
}
var AIstats = function(error,options, response) {
    //console.log(error,options,response);
    if (typeof response.rows!="undefined") {
    	for (var i=1; i<response.rows.length; i+=200) {
	    var scorec=0;
	    var n=0;
	    var median=0;
	    for (var j=0; j<200&&j+i<response.rows.length; j++) {
		var t=response.rows[i+j].cellsArray[0].split(" ");
		var ts1=t[0].split(":");
		var type1=ts1[0];
		var score1=ts1[1];
		var ts2=t[1].split(":");
		var type2=ts2[0];
		var score2=ts2[1];
		var scoreco=0;
		var scoreh=0;
		if (type2!=type1) {
		    if (type2=="Human") scoreh+=parseInt(score2,10);
		    else scoreco+=parseInt(score2,10);
		    if (type1=="Human") scoreh+=parseInt(score1,10);
		    else scoreco+=parseInt(score1,10);
		    median+=Math.floor((scoreco)/(scoreco+scoreh)*100);
		    n++;
		}
	    }
	    log(median/n);
	}
    }
}
var myCallback = function (error, options, response) {
   if (response!=null&&typeof response.rows!="undefined") {
	//console.log("found "+response.rows.length);
	var t=SEARCHINGSQUAD,t1="",s1="";
	var tt=t.split("\.");
	for (var i=0; i<tt.length; i++) {
	    t1+=tt[i].replace(/\*/g," + ").replace(/_/g," ")+"<br>";
	    s1+=tt[i].replace(/\*/g," + ").replace(/_/g," ")+"\n";
	}
	stype="";
	TEAMS[1].parseJuggler(s1,false);
	for (var i=1; i<response.rows.length; i++) {
	    myTemplate(i,response.rows[i].cellsArray,null,null);
	}
	SQUADBATTLE.columns.adjust().draw();
    }
};

var myTemplate = function(num,cells,cellarrays,labels) {
    var s="";
    var t=cells[0].split(" ");
    var ts1=t[0].split(":");
    var type1=ts1[0];
    var score1=ts1[1];
    var ts2=t[1].split(":");
    var type2=ts2[0];
    var score2=ts2[1];
    var squad=cells[1];
    var tt=squad.split("VS");
    var team1=tt[0].split("\.");
    var team2=tt[1].split("\.");
    var t1="",s1="";

    if (tt[0]==SEARCHINGSQUAD) { var sc=score2,ts=type2; team1=team2; score2=score1; type2=type1; score1=sc; type1=ts; }
    for (var j=0; j<team1.length-1; j++) {
	s1+=team1[j].replace(/\*/g," + ").replace(/_/g," ")+"\n";
	t1+=team1[j].replace(/\*/g," + ").replace(/_/g," ")+"<br>";
    }
    TEAMS[2].parseJuggler(s1,false);
    if (LANG!="en") {
	t1=TEAMS[2].toJuggler(true).replace(/\n/g,"<br>");
    }
    score1=""+score1;
    score2=""+score2;
    for (var i=0; i<3; i++) {
	if (score1.length<3) score1="0"+score1;
	if (score2.length<3) score2="0"+score2;
    }
    if (type2=="Human") score2="<b>"+score2+"</b>";
    if (type1=="Human") score1="<b>"+score1+"</b>";

    SQUADBATTLE.row.add([score2+"-"+score1,"<span onclick='$(\"#replay\").attr(\"src\",\""+cells[2]+"\")'>"+t1+"</span>"]).draw(false);
}
var computeurl=function(error, options,response) {
    console.log(error,options,response);
    var scoreh=0;
    var scorec=0;
    var n=0;
    if (typeof response.rows!="undefined") {
    	for (var i=1; i<10; i++) {
	    var squad=response.rows[i].cellsArray[0];
	    var tt=squad.split("VS");
	    var team1=tt[0].split("\.");
	    var team2=tt[1].split("\.");
	    var s1="",s2="";
	    for (var j=0; j<team1.length-1; j++) {
		s1+=team1[j].replace(/\*/g," + ").replace(/_/g," ")+"\n";
		s2+=team2[j].replace(/\*/g," + ").replace(/_/g," ")+"\n";
	    }
	    TEAMS[1].parseJuggler(s1,false);
	    TEAMS[2].parseJuggler(s2,false);
	    var longurl = response.rows[i].cellsArray[2];
	    var curl=longurl.split("?")[1];
	    var arg=LZString.decompressFromEncodedURIComponent(decodeURI(curl));
	    var args=[];
	    args= arg.split('&');
	    //log(LZString.compressToEncodedURIComponent(TEAMS[1].toASCII()+"&"+TEAMS[2].toASCII()+"&"+args[2]+"&"+args[3]+"&"+args[4]+"&"+args[5]+"&"+args[6]));
	}
    }
}
function translate(a) {
    if (typeof PILOT_translation[a]!="undefined"
	&&typeof PILOT_translation[a].name!="undefined") 
	return PILOT_translation[a].name;
    if (typeof PILOT_translation[a+" (Scum)"]!="undefined"
	&&typeof PILOT_translation[a+" (Scum)"].name!="undefined") 
	return PILOT_translation[a+" (Scum)"].name;
    if (typeof UPGRADE_translation[a]!="undefined"
	&&typeof UPGRADE_translation[a].name!="undefined") 
	return UPGRADE_translation[a].name;
    if (typeof UPGRADE_translation[a+"(Crew)"]!="undefined"
	&&typeof UPGRADE_translation[a+"(Crew)"].name!="undefined") 
	return UPGRADE_translation[a+"(Crew)"].name;
    if (typeof CRIT_translation[a]!="undefined"
	&&typeof CRIT_translation[a].name!="undefined")
	return CRIT_translation[a].name;
    return a;
}
function formatstring(s) {
    return s.replace(/%HIT%/g,"<code class='hit'></code>")
	.replace(/%ACTION%/g,"<b>Action:</b>")
	.replace(/%STRESS%/g,"<code class='xstresstoken'></code>")
	.replace(/%CRIT%/g,"<code class='critical'></code>")
	.replace(/%EVADE%/g,"<code class='symbols'>e</code>")
	.replace(/%FOCUS%/g,"<code class='symbols'>f</code>")
	.replace(/%SHIELD%/g,"<code class='cshield'></code>")
	.replace(/%HULL%/g,"<code class='chull'></code>")
	.replace(/%ROLL%/g,"<code class='symbols'>r</code>")
	.replace(/%TURNLEFT%/g,"<code class='symbols'>4</code>")
	.replace(/%TURNRIGHT%/g,"<code class='symbols'>6</code>")
	.replace(/%BOOST%/g,"<code class='symbols'>b</code>")
        .replace(/%ELITE%/g,"<code class='symbols'>E</code>")
	.replace(/%ION%/g,"<code class='xionizedtoken'></code>")
 	.replace(/%BOMB%/g,"<code class='symbols'>B</code>")
	.replace(/%STRAIGHT%/g,"<code class='symbols'>8</code>")
        .replace(/%STOP%/g,"<code class='symbols'>5</code>")
        .replace(/%TARGET%/g,"<code class='symbols'>l</code>")
        .replace(/%TORPEDO%/g,"<code class='symbols'>P</code>")
 	.replace(/%CANNON%/g,"<code class='symbols'>C</code>")
	.replace(/%SYSTEM%/g,"<code class='symbols'>S</code>")
	.replace(/%ILLICIT%/g,"<code class='symbols'>I</code>")
        .replace(/%MISSILE%/g,"<code class='symbols'>M</code>")
        .replace(/%TURRET%/g,"<code class='symbols'>U</code>")
        .replace(/%BANKLEFT%/g,"<code class='symbols'>7</code>")
        .replace(/%BANKRIGHT%/g,"<code class='symbols'>9</code>")
        .replace(/%UTURN%/g,"<code class='symbols'>2</code>")
        .replace(/%SLOOPLEFT%/g,"<code class='symbols'>1</code>")
        .replace(/%SLOOPRIGHT%/g,"<code class='symbols'>3</code>")
        .replace(/%TALONLEFT%/g,"<code class='symbols'>;</code>")
        .replace(/%TALONRIGHT%/g,"<code class='symbols'>:</code>")
        .replace(/%ASTROMECH%/g,"<code class='symbols'>A</code>")
	.replace(/%CREW%/g,"<code class='symbols'>W</code>");
}
function nextunit(cando, changeturn,changephase,activenext) {
    var i,sk=false,last=0;
    if (skillturn<0||skillturn>12) return changephase();
    for (i=0; i<tabskill[skillturn].length; i++) {
	var u=tabskill[skillturn][i];
	if (cando(u)&&u.isdocked!=true) { sk=true; last=i; break;} 
    };
    if (!sk) {
	do {
	    changeturn(tabskill);
	    last=0;
	    if (skillturn>=0 && skillturn<=12) {
		while (last<tabskill[skillturn].length&&tabskill[skillturn][last].isdocked==true) last++;
		if (last==tabskill[skillturn].length) last=-1;
	    }
	} while (skillturn>=0 && skillturn<=12 && last==-1);
    } 
    if (skillturn<0||skillturn>12||last==-1) return changephase();
    active=last; 
    tabskill[skillturn][last].select();
    activenext();
}
function endphase() {
    for (var i in squadron) squadron[i].endphase();
}
function nextcombat() {
    nextunit(function(t) { return t.canfire(); },
	     function(list) { 
		 var dead=false;
		 if (skillturn>=0) skillturn--;
		 for (var i=0; i<list[skillturn+1].length; i++) {
		     var u=list[skillturn+1][i];
		     if (u.canbedestroyed(skillturn))
			 if (u.checkdead()) dead=true;
		 }
		 if (dead&&(TEAMS[1].checkdead()||TEAMS[2].checkdead())) win();
	     },
	     function() {
		 log(UI_translation["No more firing units, ready to end phase."]); 
		 for (var i in squadron) squadron[i].endcombatphase();
		 barrier(endphase);
		 enablenextphase();
	     },
	     function() {
		 activeunit.beginattack();
		 activeunit.doattack(false);
	     });
}
function nextactivation() {
    nextunit(function(t) { return t.candomaneuver(); },
	     function() { if (skillturn<13) skillturn++; },
	     function() { return enablenextphase(); },
	     function() {     
		 activeunit.beginactivation();
		 activeunit.doactivation();
	     });
}
function nextdecloak() {
    nextunit(function(t) { return t.candecloak(); },
	     function() { if (skillturn<13) skillturn++; },
	     function() { return enablenextphase(); },
	     function() { activeunit.dodecloak(); });
}
function nextplanning() {
    nextunit(function(t) { return (t.maneuver==-1); },
	     function() { if (skillturn<13) skillturn++; },
	     function() { return enablenextphase(); },
	     function() {
		 activeunit.select();
		 activeunit.doplan();
	     });
}
function getattackresult() {
    var h=$(".hitreddice").length;
    var c=$(".criticalreddice").length;
    return FCH_CRIT*c+FCH_HIT*h;
}
function getdefenseresult() {
    return $(".evadegreendice").length+$(".evadegreen").length;
}
function addattackdie(type,n) {
    for (var i=0; i<n; i++) 
	$("#attack").append("<td class="+type+"reddice'></td>");
}
function adddefensedie(type,n) {
    for (var i=0; i<n; i++) 
	$("#defense").append("<td class="+type+"greendice'></td>");
}
function getattackdice() {
    return $(".focusreddice").length+$(".criticalreddice").length+$(".hitreddice").length+$(".blankreddice").length;
}
function getdefensedice() {
    return $(".focusgreendice").length+$(".blankgreendice").length+$(".evadegreendice").length; 
}
function displaycombatdial() {
    $("#attackdial").empty();
    $("#dtokens").empty();
    $("#defense").empty();
    $("#combatdial").show();
}
function displayattackroll(m,n) {
    var i,j=0;
    for (i=0; i<DICES.length; i++) $("."+DICES[i]+"dice").remove();
    $("#attack").empty();
    for (i=0; i<Math.floor(m/100)%10; i++,j++)
	$("#attack").append("<td class='focusreddice'></td>");
    for (i=0; i<(Math.floor(m/10))%10; i++,j++)
	$("#attack").append("<td class='criticalreddice'></td>");
    for (i=0; i<m%10; i++,j++)
	$("#attack").append("<td class='hitreddice'></td>");
    for (i=j; i<n; i++)
	$("#attack").append("<td class='blankreddice'></td>");
    var change=function() { 
	if ($(this).hasClass("focusreddice")) {
	    $(this).removeClass("focusreddice"); $(this).addClass("hitreddice");
	}  else if ($(this).hasClass("blankreddice")) {
	    $(this).removeClass("blankreddice"); $(this).addClass("focusreddice");
	} else if ($(this).hasClass("hitreddice")) {
	    $(this).removeClass("hitreddice"); $(this).addClass("criticalreddice");
	} else if ($(this).hasClass("criticalreddice")) {
	    $(this).removeClass("criticalreddice"); $(this).addClass("blankreddice");
	}
    }
    $(".focusreddice").click(change);
    $(".hitreddice").click(change);
    $(".blankreddice").click(change);
    $(".criticalreddice").click(change);
}
function displayattacktokens(u,f) {
    $("#atokens").empty();
    var dm=targetunit.getresultmodifiers(u.ar,u.ad,DEFENSE_M,ATTACK_M);
    if (dm.length>0) {
	$("#atokens").append(dm);
	$("#atokens").append($("<button>").addClass("m-done").click(function() {
	    displayattacktokens2(u,f);
	}))
    } else displayattacktokens2(u,f);
}
function displayattacktokens2(u,f) {
    //u.log(u.id+" f:"+(typeof f)+" "+(typeof u.lastaf));
    if (typeof f!="function") f=u.lastaf;
    else u.lastaf=f;
    $("#atokens").empty();
    var am=u.getresultmodifiers(u.ar,u.ad,ATTACK_M,ATTACK_M);
    if (am.length>0) {
	$("#atokens").append(am);
	$("#atokens").append($("<button>").addClass("m-done").click(function() {
	    $("#atokens").empty();
	    f();}.bind(u)));
    } else f();
}
function displaydefensetokens(u,f) {
    $("#dtokens").empty();
    var dm=activeunit.getresultmodifiers(u.dr,u.dd,ATTACK_M,DEFENSE_M);
    if (dm.length>0) {
	$("#dtokens").append(dm);
	//$("#dtokens td").click(function() { displaydefensetokens(u,f); });
	$("#dtokens").append($("<button>").addClass("m-done").click(function() {
	    displaydefensetokens2(u,f);
	}))
    } else displaydefensetokens2(u,f);
}
function displaydefensetokens2(u,f) {
    if (typeof f!="function") f=u.lastdf;
    u.lastdf=f;
    $("#dtokens").empty();
    $("#dtokens").append(u.getresultmodifiers(u.dr,u.dd,DEFENSE_M,DEFENSE_M));
    //$("#dtokens td").click(function() { displaydefensetokens2(u,f); });
    if (FAST) { 	    
	activeunit.log("fire hidden");
	$("#combatdial").hide(); 
	f(); 
    } else {
	$("#dtokens").append($("<button>").addClass("m-fire").click(function() {
	    $("#combatdial").hide();
	    f();}.bind(u)));
    }
}
function FE_focus(r) {
    return Math.floor(r/10)%10;
}
function FE_evade(r) {
    return r%10;
}
function FE_blank(r,n) {
    return n-FE_evade(r)-FE_focus(r);
}
function FCH_hit(r) {
    return r%10;
}
function FCH_focus(r) {
    return Math.floor(r/100)%10;
}
function FCH_crit(r) {
    return Math.floor(r/10)%10;
}
function FCH_blank(r,n) {
    return n-FCH_crit(r)-FCH_focus(r) - FCH_hit(r);
}
var FE_EVADE=1;
var FE_FOCUS=10;
var FCH_HIT=1;
var FCH_FOCUS=100;
var FCH_CRIT=10;

function addroll(f,id,to) {
    if (to==DEFENSE_M) return addrolld(f,id);
    var n=getattackdice();
    var foc=$(".focusreddice").length;
    var h=$(".hitreddice").length;
    var c=$(".criticalreddice").length;
    var t=f(100*foc+10*c+h,n);
    displayattackroll(t.m,t.n);
    $("#atokens #mod"+id).remove();
}
function addrolld(f,id) {
    var n=getdefensedice();
    var foc=$(".focusgreendice").length;
    var e=$(".evadegreendice").length;
    var t=f(10*foc+e,n);
    displaydefenseroll(t.m,t.n);
    $("#dtokens #mod"+id).remove();
}
function modroll(f,id,to) {
    if (to==DEFENSE_M) return modrolld(f,id);
    var n=getattackdice();
    var foc=$(".focusreddice").length;
    var h=$(".hitreddice").length;
    var c=$(".criticalreddice").length;
    var r=f(100*foc+10*c+h,n);
    displayattackroll(r,n);
    $("#atokens #mod"+id).remove();
}
function modrolld(f,id) {
    var n=getdefensedice();
    var foc=$(".focusgreendice").length;
    var e=$(".evadegreendice").length;
    var r=f(10*foc+e,n);
    displaydefenseroll(r,n);
    $("#dtokens #mod"+id).remove();
}
function displaydefenseroll(r,n) {
    var i,j=0;
    $("#defense").empty();
    for (i=0; i<Math.floor(r/10); i++,j++)
	$("#defense").append("<td class='focusgreendice'></td>");
    for (i=0; i<r%10; i++,j++)
	$("#defense").append("<td class='evadegreendice'></td>");
    for (i=j; i<n; i++)
	$("#defense").append("<td class='blankgreendice'></td>");
    var change=function() { 
	if ($(this).hasClass("focusgreendice")) {
	    $(this).removeClass("focusgreendice"); $(this).addClass("evadegreendice");
	} else if ($(this).hasClass("blankgreendice")) {
	    $(this).removeClass("blankgreendice"); $(this).addClass("focusgreendice");
	} else if ($(this).hasClass("evadegreendice")) {
	    $(this).removeClass("evadegreendice"); $(this).addClass("blankgreendice");
	}
    }
    $(".focusgreendice").click(change);
    $(".evadegreendice").click(change);
    $(".blankgreendice").click(change);
}

function reroll(n,forattack,a,id) {
    var i,l,m=0;
    var attackroll=["blank","focus","hit","critical"];
    var defenseroll=["blank","focus","evade"];
    if (typeof a.f=="function") a.f();
    if (forattack) {
	for (i=0; i<4; i++) {
	    // Do not reroll focus
	    if (activeunit.canusefocus()&&activeunit.candofocus()&&i==1) continue;
	    if (a.dice.indexOf(attackroll[i])>-1) {
		l=$("."+attackroll[i]+"reddice:not([noreroll])");
		if (l.length<n) {
		    l.remove();
		    m+=l.length;
		    n-=l.length;
		} else {
		    $("."+attackroll[i]+"reddice:lt("+n+"):not([noreroll])").remove();
		    m+=n;
		    n=0;
		    break;
		}
	    }
	}
	//console.log("rerolling "+m+" dices");
	$("#atokens #reroll"+id).remove();
	var r=activeunit.rollattackdie(m);
	for (i=0; i<m; i++) {
	    //$("#attack").prepend("<td noreroll='true' class='"+r[i]+"reddice'></td>");
	    $("#attack").prepend("<td class='"+r[i]+"reddice'></td>");
	}
    } else { 
	for (i=0; i<3; i++) {
	    // Do not reroll focus
	    if (targetunit.canusefocus()&&targetunit.candofocus()&&i==1) continue;
	    if (a.dice.indexOf(defenseroll[i])>-1) {
		l=$("."+defenseroll[i]+"greendice:not([noreroll])");
		if (l.length<n) {
		    l.remove();
		    m+=l.length;
		    n-=l.length;
		} else {
		    $("."+attackroll[i]+"greendice:lt("+n+"):not([noreroll])").remove();
		    m+=n;
		    n=0;
		    break;
		}
	    }
	}
	$("#dtokens #reroll"+id).remove();
	activeunit.defenseroll(m).done(function(r) {
	    var i;
	    for (i=0; i<FE_evade(r.roll); i++)
		$("#defense").prepend("<td class='evadegreendice'></td>");
	    for (i=0; i<FE_focus(r.roll); i++)
		$("#defense").prepend("<td class='focusgreendice'></td>");
	    for (i=0; i<FE_blank(r.roll,r.dice); i++)
		$("#defense").prepend("<td class='blankgreendice'></td>");
	});
    }
}
function next_replay() {
    var p=[];
    if (REPLAY.length>0) p=REPLAY[replayid].split("_");
    return p;
}

function enablenextphase() {
    var i;
    var ready=true;

    switch(phase) {
    case SELECT_PHASE:
	var n1=$("#squad1").attr("data-name");
	var n2=$("#squad2").attr("data-name");
	if (typeof n1=="undefined"||typeof n2=="undefined") {
	    ready=false;
	    $(".nextphase").prop("disabled",true);
	}
	break;
    case PLANNING_PHASE:
	for (i in squadron)
	    if (squadron[i].maneuver<0&&!squadron[i].isdocked) { ready=false; break; }
	if (ready&&$(".nextphase").prop("disabled")) log(UI_translation["All units have planned a maneuver, ready to end phase"]);
	break;
    case ACTIVATION_PHASE:
	if (subphase!=ACTIVATION_PHASE) {
	    subphase=ACTIVATION_PHASE; 
	    skillturn=0; 
	    ready=false;
	    for (i in squadron) squadron[i].enddecloak().done(nextactivation);
	    barrier(nextactivation);
	} else {
	    for (i in squadron)
		if (squadron[i].maneuver>-1&&!squadron[i].isdocked) { ready=false; break; }
	    if (ready&&$(".nextphase").prop("disabled")) log(UI_translation["All units have been activated, ready to end phase"]);
	}
	break;	
    }
    if (ready) $(".nextphase").prop("disabled",false);
    //log("ready "+ready);
    if (ready&&FAST&&phase>=SETUP_PHASE) 
	return nextphase();
    // Replay
    /*var p=next_replay();
    if (REPLAY.length>0&&next_replay()[0]=="nextphase") {
	log("<div style='color:white;background:blue'>##"+p[0]+":"+p[1]+"</div>");
	replayid++;
	if (phase>=PLANNING_PHASE) return nextphase();
    } else log("<div style='color:white;background:green'>##"+p[0]+":"+p[1]+"</div>");
    */
    return ready;
}

function win() {
    var title="m-draw";
    var i;
    var s1="",s2="";
    var defaults="<tr><td class='m-nocasualty'></td><td>0</td></tr>";
    var score1=0,score2=0;
    for (i=0; i<allunits.length; i++) {
	var u=allunits[i];
	if (u.dead||(u.islarge&&u.shield+u.hull<(u.ship.hull+u.ship.shield)/2)) {
	    var p=u.dead?u.points:(u.points/2);
	    if (u.team==1) {
		s2+="<tr><td>"+u.name+(!u.dead?" (1/2 points)":"")+"</td><td>"+p+"</td></tr>";
		score2+=p;
	    } else {
		s1+="<tr><td>"+u.name+(!u.dead?" (1/2 points)":"")+"</td><td>"+p+"</td></tr>";
		score1+=p;
	    }
	}
    }
    if (s1=="") s1=defaults;
    if (s2=="") s2=defaults;
    var d=score1 - score2;
    score1 = d + 100;
    score2 = 100 - d;
//    var meanhit=Math.floor(1000*TEAMS[1].allhits/TEAMS[1].allred)/1000;
//    var meancrit=Math.floor(1000*TEAMS[1].allcrits/TEAMS[1].allred)/1000;
//    var str="<td rowspan='2' class='probacell' >";
//    str+="<div style='font-size:smaller'>Average <span class='hit'></span>/die:"+meanhit+" (norm:0.375)</div><div>Average <span class='critical'></span>/die:"+meancrit+" (norm:0.125)</div></td>";

    $(".victory-table").empty();
    $(".victory-table").append("<tr><th class='m-squad1'></th><th>"+score1+"</th></tr>");
    $(".victory-table").append(s1);
//    meanhit=Math.floor(1000*TEAMS[2].allhits/TEAMS[2].allred)/1000;
//    meancrit=Math.floor(1000*TEAMS[2].allcrits/TEAMS[2].allred)/1000;
//    var str="<td rowspan='2' class='probacell' >";
//    str+="<div style='font-size:smaller'>Average <span class='hit'></span>/die:"+meanhit+" (norm:0.375)</div><div>Average <span class='critical'></span>:"+meancrit+" (norm: 0.125)</div>/die</td>";
    $(".victory-table").append("<tr><th class='m-squad2'></th><th>"+score2+"</th></tr>");
    $(".victory-table").append(s2);
    if (d>0) title="m-1win";
    else if (d<0) title="m-2win";
    $(".victory").attr("class",title);
    var titl = (TEAMS[1].isia?"Computer":"Human")+":"+score1+" "+(TEAMS[2].isia?"Computer":"Human")+":"+score2;
    var note=TEAMS[1].toJuggler(false);
    note+="VS"+TEAMS[2].toJuggler(false);
    note=note.replace(/\n/g,".");
    note=note.replace(/ \+ /g,"*");
    note=note.replace(/ /g,"_");
    //console.log("note:"+encodeURI(note));
    var link="https://api-ssl.bitly.com/v3/user/link_save?access_token=ceb626e1d1831b8830f707af14556fc4e4e1cb4c&longUrl="+encodeURI("http://xws-bench.github.io/bench/index.html?"+permalink(false))+"&title="+encodeURI(titl)+"&note="+encodeURI(note);
    $.when($.ajax(link)).done(function(result1) {
	var url;
	var text;
	text="see replay";
	if (typeof result1.data.link_save=="undefined") { 
	    url=encodeURI("http://xws-bench.github.io/bench/index.html?"+permalink(false));
	    $(".tweet").hide();
	    $(".facebook").attr("href","https://www.facebook.com/sharer/sharer.php?u="+encodeURI(url));
	    $(".googlep").attr("href","https://plus.google.com/share?url="+encodeURI(url));
	    $(".email").attr("href","mailto:?body="+url);
	} else {
	    url=result1.data.link_save.link;
	    text=url;
	    $(".tweet").attr("href","https://twitter.com/intent/tweet?url="+encodeURI(url)+"&text=A%20Squad%20Benchmark%20combat").show();

	    $(".facebook").attr("href","https://www.facebook.com/sharer/sharer.php?u="+encodeURI(url));
	    $(".googlep").attr("href","https://plus.google.com/share?url="+encodeURI(url));
	    $(".email").attr("href","mailto:?body="+url);
	}
	$(".victory-link").attr("href",url);
	$(".victory-link code").text(text);
    });
    /*var y1=0,y2=0;
    var t1=TEAMS[1].history;
    var t2=TEAMS[2].history;
    var val1=[],val2=[];
    var y1=0,y2=0;
    var scalex=$('#svgLine').height()/round;
    for (i=0; i<=round; i++) {
	if (typeof t1.rawdata[i]!="undefined") { y1+=t1.rawdata[i].hits;}
	val1[i]=y1;
	if (typeof t2.rawdata[i]!="undefined") { y2+=t2.rawdata[i].hits;}
	val2[i]=y2;
    }
    var scaley=$('#svgLine').height()/Math.max(Math.max.apply(null,val1),Math.max.apply(null,val2));
    for (i=0; i<=round; i++) { val1[i]*=scaley; val2[i]*=scaley; }

    sl = Snap('#svgLine');*/
    //sl.path("M 0 0 L "+val1);
    //sl.polyline(val2);
    //makeGrid();
    //makePath(val1,'red');
    //makePath(val2,'blue');
    window.location="#modal";
}
document.addEventListener("win",win,false);

function battlelog(t) {
    var row=SQUADLIST.row(t.parents("tr"));
    var data = row.data()[3];
    if (LANG!="en") TEAMS[0].parseJuggler(data,false);
    else TEAMS[0].parseJuggler(data,false);
    data=TEAMS[0].toJuggler(false);
    displaycombats(data);
    window.location="#battlelog";
}

function createsquad() {
    $(".activeunit").prop("disabled",true);
    $("#selectphase").hide();
    phase=CREATION_PHASE;
    $("footer").hide();
    $('#consolecb').removeAttr('Checked');
    $(".nextphase").prop("disabled",false);
    currentteam.changefaction("REBEL");
    $(".factionselect selected").val("REBEL");
    $("#creation").show();
    displayfactionunits();
    //$("#coverflow").coverflow();
}
function switchdialimg(b) {
    if (b==true) {
	$("#caroussel .shipimg").css("display","none");
	$("#caroussel .shipdial").css("display","table-cell");
    } else {
	$("#caroussel .shipdial").css("display","none");
	$("#caroussel .shipimg").css("display","table-cell");
    }
}
var mySpreadsheets=[
"https://docs.google.com/spreadsheets/d/1n35IFydakSJf9N9b9byLog2MooaWXk_w8-GQdipGe8I/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1Jzigt2slBhygjcylCsy4UywpsEJEjejvtCfixNoa_z4/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1dkvDxaH3mJhps9pi-R5L_ttK_EmDKUZwaCE9RZUYueg/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1IoViAKvpZFRlmzBXeY6S9jYX4Ju9ccL5boNxhLwUXiY/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1D2UbgrM6V7KJcRmyUQBxn5jxT-Nj8UGlpvLYlasH6TQ/edit#gid=0",
"https://docs.google.com/spreadsheets/d/15pAnwcBlp4l01eJgyNXW9uGu5jYDhxk3oSveBIQhJFc/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1P64wZXXV_3gJE0wdLTDWW2pdOliInCRlTXm1lgYNumc/edit#gid=0",
"https://docs.google.com/spreadsheets/d/1zlqDnXJ9J-k4apP1DadPx_vdv6Asdp_b9QvaytKI9ek/edit#gid=0"
];
function displayAIperformance() {
    for (var i=0; i<mySpreadsheets.length; i++) {
	$('#squadbattlediv').sheetrock({
	    url: mySpreadsheets[i],
	    query:"select B",// where C ends with '"+t+"' or C starts with '"+t+"'",
	    callback:AIstats,
	    rowTemplate:function () { return "";},
	    labels:["Score"]
	});
    }   
}
function selectrocks() {
    var ROCKSHAPES=[1,2,3,4,5,6];
    $(".aster img").click(function(e) {
	var i=parseInt(e.target.id.substr(1),10);
	if (ROCKSHAPES.indexOf(i)>-1) {
	    ROCKSHAPES[i]=null;
	} else {
	    var j;
	    for (j=0; j<6; j++) if (ROCKSHAPES[j]==null) break; 
	    if (j<6) {
		ROCKSHAPES[j]=i;
		$("#a"+i).addClass("selected");
	    }
	}
    }.bind(this))
}

/*
function recomputeurl() {
    $('#squadbattlediv').sheetrock({
	url: mySpreadsheets[0],
	query:"select C,D,E",
	callback:computeurl,
	rowTemplate:function () { return "";},
	labels:["ascii","short","long"]
    }); 
}*/
function displaycombats(t) {
    var s1=t;
    t=t.replace(/\n/g,".");
    t=t.replace(/ \+ /g,"*");
    //t=t.replace(/-/g,"\\-");
    t=t.replace(/ /g,"_");
    $("#replay").attr("src","");

    if (t.slice(-1)!=".") t=t+".";
    SEARCHINGSQUAD=t;
    //console.log("asking for "+t);

    var t1="";
    if (LANG!="en") {
	TEAMS[0].parseJuggler(s1,false);
	s1=TEAMS[0].toJuggler(true);
    }
    t1=s1.replace(/\n/g,"<br>");

    $("#battlingsquad").html(t1);
    SQUADBATTLE.clear().draw();;
 
    for (var i=0; i<mySpreadsheets.length; i++) {
	$('#squadbattlediv').sheetrock({
	    url: mySpreadsheets[i],
	    query:"select B,C,D where C contains '"+t+"'",
	    callback:myCallback,
	    rowTemplate:function () { return "";},
	    labels:["Score","Squadlist","URL"]
	});
    }   
}
function dial2JSON(dial) {
    var m=[];
    var j,k;
    for (j=0; j<=5; j++) m[j]={item:"",moves:null};
    for (j=0; j<dial.length; j++) {
	d=dial[j];
	var cx=MPOS[d.move][0],cy=MPOS[d.move][1];
	m[5-cx].item=cx;
	if (m[5-cx].moves==null) {
	    m[5-cx].moves=[];
	    for (k=0; k<=6; k++) m[5-cx].moves[k]={difficulty:"",key:""};
	}
	m[5-cx].moves[cy]={difficulty:d.difficulty,key:P[d.move].key};
    }
    return m;
}
function displayfactionunits() {
    var count=0;
    var n=0;
    var i,j,k;
    var faction=currentteam.faction;
    var p={};
    var t={};
    var uu=[];
    if (phase!=CREATION_PHASE) return;
    for (i in unitlist) if (unitlist[i].faction.indexOf(faction)>-1) count++;

    var tz = Math.round( ( 186 / 2 ) / Math.tan( Math.PI / count ) );
    $(".caroussel").html("");
    increment = 360. / count;
    var str;
    for (i=0; i<PILOTS.length; i++) {
	var u=PILOTS[i].unit;
	if (PILOTS[i].faction==faction) {
	    if (typeof p[u]=="undefined") p[u]=[];
	    /* should go elsewhere */
	    if (PILOTS[i].upgrades.indexOf(ELITE)>-1) PILOTS[i].haselite=true;
	    var text=getpilottexttranslation(PILOTS[i].name,faction);
	    if (text!="")
		text+=(PILOTS[i].done==true?"":"<div><strong class='m-notimplemented'></strong></div>");
	    PILOTS[i].tooltip=text;
	    PILOTS[i].trname=translate(PILOTS[i].name);
	    p[u].push(PILOTS[i]);
	    //PILOTS[i].pilotid=i;
	}
    }
    for (u in p) p[u].sort(function(a,b) { return a.points - b.points; });
    for (i=0; i<UPGRADES.length; i++) {
	var u=UPGRADES[i];
	if (u.type==TITLE) unitlist[u.ship].hastitle=true;
    }
    for (i in unitlist) 
	if (unitlist[i].faction.indexOf(faction)>-1) { 
	    unitlist[i].trname=SHIP_translation[i]; 
	    unitlist[i].name=i;
	    if (typeof unitlist[i].trname=="undefined") unitlist[i].trname=i;
	    uu.push(unitlist[i]);
	}
    uu.sort(function(a,b) { return a.trname > b.trname; });
    for (i=0; i<uu.length; i++) {
	str="";
	n++;
	var u=uu[i];
	var rendered=Mustache.render(TEMPLATES["faction"], {
	    shipimg:u.img[0],
	    fire:repeat('u',u.fire),
	    evade:repeat('u',u.evade),
	    hull:repeat('u',u.hull),
	    shield:repeat('u',u.shield),
	    diallist:dial2JSON(u.dial),
	    shipname:u.trname,
	    actionlist:function() {
		var al=[];
		for (j=0; j<u.actionList.length; j++) al[j]=A[u.actionList[j]].key;
		return al;
	    },
	    hastitle:u.hastitle,
	    shipupgrades:p[u.name][0].upgrades,
	    pilots:p[u.name]
	});
	$("#caroussel").append("<li>"+rendered+"</li>");	    
    }
}
function getpilottexttranslation(name,faction) {
    var idxn=name+(faction=="SCUM"?" (Scum)":"");
    if (typeof PILOT_translation[idxn]!="undefined"&&typeof PILOT_translation[idxn].text!="undefined") return formatstring(PILOT_translation[idxn].text);
    return "";
}
function getupgtxttranslation(name,type) {
    var v=name+(type==CREW?"(Crew)":"");
    if (typeof UPGRADE_translation[v]!="undefined"&&typeof UPGRADE_translation[v].text!="undefined") return formatstring(UPGRADE_translation[v].text)
    return "";
}
function addunique(name) {
    UNIQUE[name]=true;
    for (var i=0; i<PILOTS.length; i++) {
	if (name==PILOTS[i].name) $(".pilots button[pilotid="+PILOTS[i].pilotid+"]").prop("disabled",true);
    }
    for (var i=0; i<UPGRADES.length; i++) {
	if (name==UPGRADES[i].name) $(".upglist button[data="+i+"]").prop("disabled",true);
    }
}
function removeunique(name) {
    UNIQUE[name]=false;
    for (var i=0; i<PILOTS.length; i++) {
	if (name==PILOTS[i].name) $(".pilots button[pilotid="+PILOTS[i].pilotid+"]").prop("disabled",false);
    }
    for (var i=0; i<UPGRADES.length; i++) {
	if (name==UPGRADES[i].name) $(".upglist button[data="+i+"]").prop("disabled",false);
    }
}
function addlimited(u,data) {
    $("#unit"+u.id+" .upglist button[data="+data+"]").prop("disabled",true);
}
function removelimited(u,data) {
    $("#unit"+u.id+" .upglist button[data="+data+"]").prop("disabled",false);
}
function addupgradeaddhandler(u) {
    $("#unit"+u.id+" button.upgrades").click(function(e) {
	var org=e.currentTarget.getAttribute("class").split(" ")[1];
	var num=e.currentTarget./*parentElement.*/getAttribute("num");
	var p=this.getupgradelist(org);
	$("#unit"+this.id+" .upgs .upgavail").hide();
	$("#unit"+this.id+" .upgs .upg").hide();
	$("#unit"+this.id+" .upglist").empty();
	$("#unit"+this.id+" .upglist").append("<tr><td><button>+</button></td><td><span class='m-none'></span></td><td></td><td></td></tr>");
	/*$("#unit"+this.id+" .upglist ").click(function() {
	    $("#unit"+this.id+" .upglist").empty();
	}.bind(this));*/
	if (typeof this.upgbonus[org]=="undefined") this.upgbonus[org]=0;
	for (var i=0; i<p.length; i++) {
	    var upg=UPGRADES[p[i]];
	    var disabled=false;
	    var pts=upg.points+this.upgbonus[org];
	    if (upg.points>0&&pts<0) pts=0;
	    var tt=">";
	    var attack="</td><td>";
	    if (typeof upg.attack!="undefined") attack="<span class='statfire'>"+upg.attack+"</span></td><td>["+upg.range[0]+"-"+upg.range[1]+"]";
	    var text=formatstring(getupgtxttranslation(upg.name,upg.type));
	    if (text!="") tt=" class='tooltip'>"+text+(upg.done==true?"":"<div><strong class='m-notimplemented'></strong></div>");

	    if (UNIQUE[upg.name]==true) disabled=true;
	    if ((upg.limited==true||this.exclupg[upg.type]==true)&&$("#unit"+this.id+" .upg span[data="+p[i]+"]").length>0) disabled=true;
	    $("#unit"+this.id+" .upglist").append("<tr><td><button "+(disabled?"disabled":"")+" num="+num+" data="+p[i]+">+</button></td><td>"+translate(upg.name).replace(/\(Crew\)/g,"")+"</td><td>"+pts+"</td><td>"+attack+"</td><td"+tt+"</td></tr>")
	}
	$("#unit"+this.id+" .upglist button").click(function(e) {
	    var data=e.currentTarget.getAttribute("data");
	    var num=e.currentTarget.getAttribute("num");
	    $("#unit"+this.id+" .upgs .upgavail").show();
	    $("#unit"+this.id+" .upgs .upg").show();
	    addupgrade(this,data,num);
	}.bind(this));
    }.bind(u));
}
function addunit(n) {
    var u=new Unit(currentteam.team,n);
    $("#listunits").append("<li id='unit"+u.id+"'></li>");
    u.show();
    $("li#unit"+u.id).hover(function() { $(".highlighted").removeClass("highlighted"); 
					 $(this).addClass("highlighted"); },
			 function() { });
    if (u.unique==true) addunique(u.name);
    $("#unit"+u.id+" .close").click(function() {
	var data=$(this).attr("data");
	var u=generics["u"+data];
	$("#unit"+data+" .upg div[data]").each(function() {
	    var d=$(this).attr("data");
	    if (UPGRADES[d].unique==true) removeunique(UPGRADES[d].name);
	});
	if (PILOTS[u.pilotid].unique==true) removeunique(u.name);
	$("#unit"+data).remove();
	delete generics["u"+data];
	currentteam.updatepoints();
    });
    $("#unit"+u.id+" .duplicate").click(function() {
	var data=$(this).attr("data");
	var u=generics["u"+data];
	var self=addunit(u.pilotid);
	$("#unit"+data+" .upg div[data]").each(function() {
	    var d=$(this).attr("data");
	    var num=$(this).attr("num");
	    if (UPGRADES[d].unique!=true&&u.upgnocopy!=d) addupgrade(self,d,num);
	});
    });
    currentteam.updatepoints();
    addupgradeaddhandler(u);
    return u;
}
function addupgrade(self,data,num,noremove) {
    var org=UPGRADES[data];
    $("#unit"+self.id+" .upglist").empty();
    if (typeof org=="undefined") return;
    if (org.unique==true) addunique(org.name);
    if (org.limited==true) addlimited(self,data);
    $("#unit"+self.id+" .upgavail span[num="+num+"]").css("display","none");
    var text=translate(org.name).replace(/\(Crew\)/g,"").replace(/\'/g,"");
    if (typeof self.upgbonus[org.type]=="undefined") self.upgbonus[org.type]=0;
    var pts=org.points+self.upgbonus[org.type];
    if (org.points>=0&&pts<0) pts=0;
    $("#unit"+self.id+" .upg").append("<div data="+data+" num="+num+"><code class='upgrades "+org.type+"'></code>"+text+"<span class='pts'>"+pts+"</span></div>");
    self.upg[num]=data;
    Upgrade.prototype.install.call(org,self);
    if (typeof org.install!="undefined") org.install(self);
    $("#unit"+self.id+" .shipdial").html("<table>"+self.getdialstring()+"</table>");

    self.showupgradeadd();
    self.showactionlist();
    self.showstats();
    currentteam.updatepoints();
    if (typeof noremove=="undefined") { 
	$("#unit"+self.id+" .upg div[num="+num+"]").click(function(e) {
	    var num=e.currentTarget.getAttribute("num");
	    var data=e.currentTarget.getAttribute("data");
	    $("#unit"+self.id+" .upglist").empty();
	    removeupgrade(self,num,data);
	}.bind(self));
    } else self.upgnocopy=data;

}
function removeupgrade(self,num,data) {
    var org=UPGRADES[data];
   $("#unit"+self.id+" .upgavail span[num="+num+"]").css("display","block");
    $("#unit"+self.id+" .upg div[num="+num+"]").remove();
    if (org.unique==true) removeunique(org.name);
    if (org.limited==true) removelimited(self,data);
    self.upg[num]=-1;
    if (typeof org.uninstall!="undefined") org.uninstall(self);
    Upgrade.prototype.uninstall.call(org,self);
    $("#unit"+self.id+" .shipdial").html("<table>"+self.getdialstring()+"</table>");

    self.showupgradeadd();
    self.showactionlist();
    self.showstats();
    currentteam.updatepoints();
}
function setselectedunit(n,td) {
    var jug=td; 
    currentteam=TEAMS[n];
    try {
	currentteam.parseJuggler(jug,true);
    } catch(e) {
	currentteam.parseJuggler(jug,false);
    }
    currentteam.name=currentteam.toASCII();
    currentteam.toJSON(); // Just for score
    addrow(n,currentteam.name,0,currentteam.faction,currentteam.toJuggler(true));
}
function addrow(team,name,pts,faction,jug,fill) {
    if (team==1) {$("#squad1").val(jug); $("#squad1").attr("data-name",name);}
    if (team==2) {$("#squad2").val(jug); $("#squad2").attr("data-name",name);}
    enablenextphase();
    var n=faction.toUpperCase();
    if (typeof localStorage[name]=="undefined"||fill==true)
	SQUADLIST.row.add(["",n,""+pts,jug,name,"",""]).draw(false);
}
//function addrowcombat(link,team1,team2,n) {
    //var clicks="https://api-ssl.bitly.com/v3/link/clicks?access_token=ceb626e1d1831b8830f707af14556fc4e4e1cb4c&link="+encodeURI(link);
    //$.when($.ajax(clicks)).done(function(result1) {
//    COMBATLIST.row.add(["",link,n,team1,team2]).draw(false);
    //});
//}

function endselection() {
    var team;
    $("#creation").hide();
    $("#selectphase").show();
    currentteam.name="SQUAD."+currentteam.toASCII();
    currentteam.toJSON();// Just for points
    var jug=currentteam.toJuggler(false);
    if (typeof localStorage[currentteam.name]=="undefined") {
	localStorage[currentteam.name]=JSON.stringify({"pts":currentteam.points,"faction":currentteam.faction,"jug":jug,"rocks":currentteam.rocks});
    }
    if (currentteam==TEAMS[1]) team=1; else if (currentteam==TEAMS[2]) team=2; 
    addrow(team,currentteam.name,currentteam.points,currentteam.faction,currentteam.toJuggler(true));
}
function removerow(t) {
    var row = SQUADLIST.row(t.parents("tr"));
    var data = row.data()[4];
    delete localStorage[data];
    row.remove().draw(false);
}

function checkrow(n,t) {
   var row=SQUADLIST.row(t.parents("tr"));
    var data = row.data()[3];
    var name=row.data()[4];
    if (name.match("SQUAD")) {
	TEAMS[n].setrocks($.parseJSON(localStorage[name]).rocks);
    }
    setselectedunit(n,data);
}
function importsquad(t) {
    currentteam.parseJSON($("#squad"+t).val(),true);
    currentteam.name="SQUAD."+currentteam.toASCII();
    var jug=currentteam.toJuggler(true);
    currentteam.toJSON(); // just for points
    localStorage[currentteam.name]=JSON.stringify({"pts":currentteam.points,"faction":currentteam.faction,"jug":currentteam.toJuggler(false)});
    addrow(t,currentteam.name,currentteam.points,currentteam.faction,jug);
}
function findsquad(t) {
    currentteam.parseJSON($("#squad"+t).val(),true);
    var jug=currentteam.toJuggler(false);
    var pattern=jug.replace(/ \+.*/g,"").replace(/\n/g,".*\.").replace(/ /g,"_");
    $('#squad'+t).sheetrock({
	url: mySpreadsheets[0],
	query:"select C where C matches '.*VS"+pattern+"'",
	callback:matchsquad,
	rowTemplate:function () { return "";},
	labels:["squad"]
    }); 
}
function matchsquad(error, options,response) {
    if (response!=null&&typeof response.rows!="undefined") {
	response.rows.sort(function(a,b) { return a.cellsArray[0]<b.cellsArray[0]; });
	var str="<ol>";
	var oldsquad="";
   	for (var i in response.rows) {
	    var squad=response.rows[i].cellsArray[0];
	    var tt=squad.split("VS");
	    if (tt[1]==oldsquad) continue;
	    str+="<li>"+tt[1]+"</li>";
	    oldsquad=tt[1];
	}
	str+="</ol>";
    }
}
function startcombat() {
}
function filltabskill() {
    var i;
    tabskill=[];
    for (i=0; i<=12; i++) tabskill[i]=[];
    for (i in squadron) tabskill[squadron[i].getskill()].push(squadron[i]);
    for (i=0; i<=12; i++) tabskill[i].sort(function(a,b) {
	var xa=0,xb=0;
	if (TEAMS[a.team].initiative==true) xa=1; 
	if (TEAMS[b.team].initiative==true) xb=1;
	if (xb-xa==0) return (b.id-a.id);
	return xb-xa;
    });
}

var ZONE=[];
function movelog(s) {
    ANIM+="_-"+s;
}
function nextphase() {
    var i;
    movelog("P-"+round+"-"+(phase+1));
    // End of phases
    //if (!enablenextphase()) return;
    window.location="#";
    switch(phase) {
    case SELECT_PHASE:
	$(".mainbutton").hide();
	$("#game").show();
	$("#selectphase").hide();
	$("#creation").hide();
	$("#rightpanel").show();
	$("#leftpanel").show();
	if ($("#player1 option:checked").val()=="human") 
	    TEAMS[1].isia=false; else TEAMS[1].isia=true;
	if ($("#player2 option:checked").val()=="human") 
	    TEAMS[2].isia=false; else TEAMS[2].isia=true;
	for (var i in squadron) console.log("--squadron["+i+"]:"+squadron[i].name+" "+squadron[i].id);
	
 	break;
    case CREATION_PHASE:
	endselection();
	phase=SELECT_PHASE;
	return;
    case SETUP_PHASE: 
	$(".buttonbar .share-buttons").hide();
	$("#leftpanel").show();
	$(".bigbutton").hide();
	ZONE[1].remove();
	ZONE[2].remove();
	TEAMS[1].endsetup();
	TEAMS[2].endsetup();
	PERMALINK=permalink(true);
	$(".playerselect").remove();
	$(".nextphase").prop("disabled",true);
	$(".unit").css("cursor","pointer");
	$("#positiondial").hide();
	for (i=0; i<OBSTACLES.length; i++) OBSTACLES[i].g.undrag();
	HISTORY=[];
	/*
	if (REPLAY.length>0) {
	    replayid=0;
	    for (var i=0; i<this.squadron.length; i++) 
		$.extend(this.squadron[i],ReplayUnit.prototype);

	}*/
	//$(".permalink").hide();
	break;
    case PLANNING_PHASE:
	$("#maneuverdial").hide();
	break;
    case ACTIVATION_PHASE:
	$("#activationdial").hide();
	for (i in squadron) {
	    squadron[i].hasmoved=false; 
	    squadron[i].hasdecloaked=false;
	    squadron[i].actiondone=false;
	    squadron[i].endactivationphase();
	}
	var b=[];
	for (i=0; i<BOMBS.length; i++) b[i]=BOMBS[i];
	for (i=0; i<b.length; i++) b[i].explode();
	break;
    case COMBAT_PHASE:
	$("#attackdial").hide();
	$("#listunits").html("");
	for (i in squadron) squadron[i].endround();
	round++;
	break;
    }
    phase=(phase==COMBAT_PHASE)?PLANNING_PHASE:phase+1;
    if (phase==1) $("#phase").empty();
    else if (phase<3) $("#phase").html(UI_translation["phase"+phase]);
    else $("#phase").html(UI_translation["turn #"]+round+" "+UI_translation["phase"+phase]);
    $("#combatdial").hide();
    if (phase>SELECT_PHASE) for (i in squadron) {squadron[i].unselect();}
    // Init new phase

    $(".nextphase").prop("disabled",false);
    switch(phase) {
    case SELECT_PHASE:

	$(".mainbutton").show();
	$(".buttonbar .share-buttons").hide();
	$(".h2 .share-buttons").show();
	$(".permalink").hide();
	$(".activeunit").prop("disabled",true);
	$("#rightpanel").hide();
	$("#leftpanel").hide();
	$("#game").hide();
	$("#selectphase").show();
	$("#creation").hide();
	currentteam.setfaction("REBEL");
	$(".nextphase").prop("disabled",true);
	//window.location="#creation";
	break;
    case SETUP_PHASE:
	var t=["bomb","weapon","upgrade"];
	for (var i=0;i<t.length; i++) {
	    TEMPLATES[t[i]]=$("#"+t[i]).html();
	    Mustache.parse(TEMPLATES[t[i]]);
	}
	$(".bigbutton").show();
	$(".buttonbar .share-buttons").show();
	$("#team2").css("top",$("nav").height()+2);
	$("#team1").css("top",$("nav").height()+2);
	$(".ctrl").css("display","block");
	
	ZONE[0]=s.path(SETUPS.playzone).attr({
		strokeWidth: 6,
		stroke:halftone(WHITE),
		strokeDasharray:"20,10,5,5,5,10",
		id:'ZONE',
		pointerEvents:"none"
	    });
	if (SETUP.background!="") $(".playmat").css({background:"url("+SETUP.background+") no-repeat",backgroundSize:"100% 100%"});
	ZONE[0].attr("fillOpacity",0);
	ZONE[0].appendTo(VIEWPORT);
	ZONE[1]=s.path(SETUPS.zone1).attr({
		fill: TEAMS[1].color,
		strokeWidth: 2,
		opacity: 0.3,
		pointerEvents:"none"
	    });
	ZONE[1].appendTo(VIEWPORT);
	ZONE[2]=s.path(SETUPS.zone2).attr({
		fill: TEAMS[2].color,
		strokeWidth: 2,
		opacity: 0.3,
		pointerEvents:"none"
	    });
	ZONE[2].appendTo(VIEWPORT);
	TEAMS[1].endselection(s);
	TEAMS[2].endselection(s);
	loadsound();

	if (TEAMS[1].points>TEAMS[2].points) TEAMS[2].initiative=true;
	else {
	    if (TEAMS[2].faction=="EMPIRE") TEAMS[2].initiative=true;
	    else TEAMS[1].initiative=true;
	}
	if (TEAMS[1].initiative==true) log("TEAM #1 has initiative");
	else log("TEAM #2 has initiative");
	$(".activeunit").prop("disabled",false);
	var i;
	for (i in squadron) if (!squadron[i].isdocked) break;
	activeunit=squadron[i];
	activeunit.select();
	activeunit.show();
	var zoom=function(centerx,centery,z) {
	    var w=$("#svgout").width();
	    var h=$("#svgout").height();
	    var startX=0;
	    var startY=0;
	    if (h>w) startY=(h-w)/2;
	    else startX=(w-h)/2;
	    var max=Math.max(900./w,900./h);
	    var offsetX=(centerx-startX)*max;
	    var offsetY=(centery-startY)*max;
	    var vm=VIEWPORT.m.clone().invert();
	    var x=vm.x(offsetX,offsetY);
	    var y=vm.y(offsetX,offsetY);
	    VIEWPORT.m.translate(x,y).scale(z).translate(-x,-y);
	    VIEWPORT.transform(VIEWPORT.m);
	    activeunit.show();
	}
	$("#svgout").bind('mousewheel DOMMouseScroll', function(event){
	    var e = event.originalEvent; // old IE support
	    var delta;
	    if (typeof e.wheelDelta != "undefined") 
		delta=e.wheelDelta / 360.;
	    else delta = e.detail/ -9.;
	    var z=Math.pow(1.1, delta);
	    zoom(e.clientX-$("#team1").width(),e.clientY-$("nav").height(),z);
	});

	$("#svgout").mousedown(function(event) { dragstart(event);});
	$("#svgout").mousemove(function(e) {dragmove(e);});
	$("#svgout").mouseup(function(e) {dragstop(e);});
	jwerty.key("escape", nextphase);
	/*$(document).keyup(function(event) {
	    if (event.which==13) {
		$(".wbutton").trigger("click");
	    }
	});*/
	/* By-passes */
	jwerty.key("9", function() { 
		console.log("active:"+activeunit.name+" in hit range:"+activeunit.weapons[0].name);
		var w=activeunit.weapons[0];
		for (var i in squadron) {
		    console.log("      "+squadron[i].name+":"+w.getrange(squadron[i]));
		}
	    });
	jwerty.key("p",function() {
	    activeunit.showpossiblepositions();
	    //activeunit.evaluateposition();
	});
	jwerty.key("m",function() {
	    activeunit.showmeanposition();
	});
	jwerty.key("shift+p",function() {
	    $(".possible").remove();
	});
	jwerty.key("1", function() { activeunit.addfocustoken();activeunit.show();});
	jwerty.key("2", function() { activeunit.addevadetoken();activeunit.show();});
	jwerty.key("3", function() { if (!activeunit.iscloaked) {activeunit.addcloaktoken();activeunit.show();}});
	jwerty.key("4", function() { activeunit.addstress();activeunit.show();});
	jwerty.key("5", function() { activeunit.addiontoken();activeunit.show();});
	jwerty.key("6", function() { activeunit.addtractorbeamtoken();activeunit.show();});
	jwerty.key("shift+1", function() { if (activeunit.focus>0) activeunit.removefocustoken();activeunit.show();});
	jwerty.key("shift+2", function() { if (activeunit.evade>0) activeunit.removeevadetoken();activeunit.show();});
	jwerty.key("shift+3", function() { if (activeunit.iscloaked) {activeunit.removecloaktoken();activeunit.show();}});
	jwerty.key("shift+4", function() { if (activeunit.stress>0) activeunit.removestresstoken();activeunit.show();});
	jwerty.key("shift+5", function() { if (activeunit.ionized>0) activeunit.removeiontoken();});
	jwerty.key("shift+6", function() { if (activeunit.tractorbeam>0) activeunit.removetractorbeamtoken();});
	jwerty.key("f",function() { 
	    var s=""; 
	    for(i in activeunit.actionsdone) s+=activeunit.actionsdone[i]+" ";
	    activeunit.log("actions done:"+s);
	});
	jwerty.key("d",function() { activeunit.resolvehit(1);});
	jwerty.key("c",function() { activeunit.resolvecritical(1);});
	jwerty.key("shift+d",function() { 
	    if (activeunit.hull<activeunit.ship.hull) activeunit.addhull(1); 
	    else if (activeunit.shield<activeunit.ship.shield) activeunit.addshield(1); 
	    activeunit.show();
	});
	if (SETUPS.asteroids>0) {
	    loadrock(s,ROCKDATA);
	}
	log("<div>["+UI_translation["turn #"]+round+"]"+UI_translation["phase"+phase]+"</div>");
	$(".unit").css("cursor","move");
	$("#positiondial").show();
	$(".permalink").show();
	startreplayall();
	break;
    case PLANNING_PHASE: 
	active=0;
	/* For actions of all ships */
	actionr = [$.Deferred().resolve()];
	/* For phase */
	actionrlock=$.Deferred().resolve();
	log("<div>["+UI_translation["turn #"]+round+"]"+UI_translation["phase"+phase]+"</div>");
	$(".nextphase").prop("disabled",true);
	$("#maneuverdial").show();
	skillturn=0;
	filltabskill();
	for (i in squadron) {
	    squadron[i].newm=squadron[i].m;
	    squadron[i].beginplanningphase().progress(nextplanning);
	}
	nextplanning();
	break;
    case ACTIVATION_PHASE:
	log("<div>["+UI_translation["turn #"]+round+"]"+UI_translation["phase"+phase]+"</div>");
	$(".nextphase").prop("disabled",true);
	$("#activationdial").show();
	for (i in squadron) squadron[i].beginactivationphase().done(nextdecloak);
	
	filltabskill();
	subphase=DECLOAK_PHASE;
	skillturn=0;
	barrier(nextdecloak);
	break;
    case COMBAT_PHASE:
	log("<div>["+UI_translation["turn #"]+round+"]"+UI_translation["phase"+phase]+"</div>");
	$("#attackdial").show();
	skillturn=12;
	/*for (var j=12; j>=0; j--) 
	    for (var i=0; i<tabskill[j].length; i++) {
		var u=tabskill[j][i];
		u.begincombatphase().done(nextcombat);
	    };
*/
	for (i in squadron) squadron[i].begincombatphase().done(nextcombat);
	barrier(nextcombat);
	break;
    }
}
function barrier(f) {
    $.when.apply(null,actionr).done(f);
}
function log(str) {
    $("#log").append("<div>"+str+"<div>");
    $("#log").scrollTop(10000);
}
function permalink(reset) {
    var r="";
    if (!reset) { if (REPLAY!="") r=REPLAY; else r=ANIM; } 
    return LZString.compressToEncodedURIComponent(TEAMS[1].toASCII()+"&"+TEAMS[2].toASCII()+"&"+saverock()+"&"+TEAMS[1].isia+"&"+TEAMS[2].isia+"&"+SETUP.name+"&"+r);
}
function resetlink() {
    switch (phase) {
    case SETUP_PHASE:
    case SELECT_PHASE: 
	document.location.search="";
	var uri=document.location.href;
	if (uri.indexOf("?") > 0) {
	    var clean_uri = uri.substring(0, uri.indexOf("?"));
	    window.history.replaceState({}, document.title, clean_uri);
	}
	document.location.reload(true);
	break;
    case CREATION_PHASE: phase=0; document.location.search=""; nextphase(); break; 
    default: 
	//log("reset to phase 0");
	phase=0;
	if (document.location.href.indexOf("?")>0) document.location.reload(true);
	else document.location.search="?"+PERMALINK;
	//document.location.assign(document.location.href);
	//document.location.reload(true);
    }
}
function record(id,val,str) {
    //HISTORY.push({s:str,v:val,id:id});
    //log("<div style='background-color:red;color:white'>"+id+"."+str+":"+val+"<div>");
}
function history_toASCII() {
    var str="";
    for (var i=0; i<HISTORY.length; i++) 
	str+=HISTORY[i].s+"_"+HISTORY[i].id+";"
    return str;
}
function select(id) {
    var i;
    for (i in squadron) {
	if (squadron[i].id==id) break;
    }
    squadron[i].select();
    //$("#"+u.id).attr({color:"black",background:"white"});
    $("#"+activeunit.id).attr({color:"white",background:"tomato"});
}

var a1 = [];
a1[0]=2/8; // blank
a1[1]=3/8; // hit
a1[10]=1/8; // crit
a1[100]=2/8; // focus
var d1 = [];
d1[0]=3/8; // blank
d1[1]=3/8; // evade
d1[10]=2/8; // focus

// Add one dice to already existing roll of n dices
function addattackdice(n,proba) {
    var f,c,h,i;
    var p=[];
    for (f=0; f<n; f++) 
	for (h=0; h<n-f; h++)
	    for (c=0; c<n-h-f; c++) {
		i=100*f+h+10*c;
		p[i]=0;
		p[i+1]=0;
		p[i+10]=0;
		p[i+100]=0;
	    }
    for (f=0; f<n; f++) 
	for (h=0; h<n-f; h++) 
	    for (c=0; c<n-h-f; c++) {
		i=100*f+h+10*c;
		p[i]+=proba[i]*a1[0];
		p[i+1]+=proba[i]*a1[1];
		p[i+10]+=proba[i]*a1[10];
		p[i+100]+=proba[i]*a1[100];
	    }
    return p;
}
function adddefensedice(n,proba) {
    var f,e,i;
    var p=[];
    for (f=0; f<n; f++) {
	for (e=0; e<n-f; e++) {
	    i=10*f+e;
	    p[i]=0;
	    p[i+1]=0;
	    p[i+10]=0;	   
	}
    }
    for (f=0; f<n; f++) {
	for (e=0; e<n-f; e++) {
	    i=10*f+e;
	    p[i]+=proba[i]*d1[0];
	    p[i+1]+=proba[i]*d1[1];
	    p[i+10]+=proba[i]*d1[10];
	}
    }
    return p;
}

function attackproba(n) {
    var i;
    var proba=[];
    proba[0]=a1[0];
    proba[1]=a1[1];
    proba[10]=a1[10];
    proba[100]=a1[100];
    for (i=2; i<=n; i++) {
	proba=addattackdice(i,proba);
    }

    return proba;
}
function defenseproba(n) {
    var i;
    var proba=[];
    proba[0]=d1[0];
    proba[1]=d1[1];
    proba[10]=d1[10];
    for (i=2; i<=n; i++) {
	proba=adddefensedice(i,proba);
    }
    return proba;
}
function attackwithreroll(tokensA,at,attack) {
    var f,h,c,f2,h2,c2,i,j,b;
    var p=[];
    if (tokensA.reroll==0) return at;
    if (typeof tokensA.reroll=="undefined") return at;
    //log("THERE IS REROLL:"+tokensA.reroll);
    for (f=0; f<=attack; f++) 
	for (h=0; h<=attack-f; h++)
	    for (c=0; c<=attack-h-f; c++) {
		i=100*f+h+10*c;
		p[i]=0;
	    }
    var newf=0, r;
    for (f=0; f<=attack; f++) 
	for (h=0; h<=attack-f; h++) 
	    for (c=0; c<=attack-h-f; c++) {
		i=100*f+h+10*c;
		b=attack-h-c-f; // blanks
		r=tokensA.reroll;
		newf=f;
		if (tokensA.reroll>b) { // more reroll than blanks
		    if (tokensA.focus==0) {
			if (tokensA.reroll>f+b) { // more rerolls than blanks+focus
			    r=f+b;
			    newf=0; // no more focus in results
			} else newf=f-(r-b);
		    } else r=b;
		} 
		//log(tokensA.reroll+">>["+f+" "+h+" "+c+"] f"+newf+" r"+r);
		if (r==0) p[i]+=at[i];
		else {
		    var tot=0;
		    for (f2=0; f2<=r; f2++) 
			for (h2=0; h2<=r-f2; h2++)
			    for (c2=0; c2<=r-f2-h2; c2++) {
				j=100*f2+h2+10*c2;
				k=100*(newf+f2)+h+h2+10*(c+c2);
				p[k]+=at[i]*ATTACK[r][j];
//				if (tokensA.reroll>0) log(attack+" at["+f+" "+h+" "+c+"]:"+at[i]+"*A["+r+"]["+f2+" "+h2+" "+c2+"]:"+ATTACK[r][j]);
			    }
		}
	    }
    return p;
}
function defendwithreroll(tokensD,dt,defense) {
    var f,e,f2,e2,i,j,b;
    var p=[];
    if (tokensD.reroll==0) return dt;
    if (typeof tokensD.reroll=="undefined") return dt;
    //log("THERE IS REROLL:"+tokensA.reroll);
    for (f=0; f<=defense; f++) for (e=0; e<=defense-f; e++) p[10*f+e]=0;
    var newf=0, r;
    for (f=0; f<=defense; f++) 
	for (e=0; e<=defense-f; e++) {
	    i=10*f+e;
	    b=defense-e-f; // blanks
	    r=tokensD.reroll;
	    newf=f;
	    if (tokensD.reroll>b) { // more reroll than blanks
		if (tokensD.focus==0) {
		    if (tokensD.reroll>f+b) { // more rerolls than blanks+focus
			r=f+b;
			newf=0; // no more focus in results
		    } else newf=f-(r-b);
		} else r=b;
	    } 
	    //log(tokensA.reroll+">>["+f+" "+h+" "+c+"] f"+newf+" r"+r);
	    if (r==0) p[i]+=dt[i];
	    else {
		for (f2=0; f2<=r; f2++) 
		    for (e2=0; e2<=r-f2; e2++) {
			j=10*f2+e2;
			k=10*(newf+f2)+e+e2;
			p[k]+=dt[i]*DEFENSE[r][j];
		    }
	    }
	}
    return p;
}

function tohitproba(tokensA,tokensD,at,dt,attack,defense) {
    var p=[];
    var k=[];
    var f,h,c,d,fd,e,i,j,hit,evade;
    var tot=0,mean=0,meanc=0;
    var ATable=at;
    var DTable=dt;
    var rr=tokensA.reroll;
    var dt=(defense==0)?[]:dt;
    for (h=0; h<=attack; h++) {
	for (c=0; c<=attack-h; c++) {
	    i=h+10*c;
	    p[i]=0;
	}
    }
    
    if (typeof ATable=="undefined") return {proba:[],tohit:0,meanhit:0,meancritical:0,tokill:0};
    ATable=attackwithreroll(tokensA,at,attack);
    //log("Attack "+attack+" Defense "+defense);
    if (defense>0) DTable=defendwithreroll(tokensD,dt,defense);
    for (j=0; j<=20; j++) { k[j]=0; }
    for (f=0; f<=attack; f++) {
	for (h=0; h<=attack-f; h++) {
	    for (c=0; c<=attack-h-f; c++) {
		var n=FCH_FOCUS*f+FCH_CRIT*c+FCH_HIT*h;
		var fa,ca,ha,ff,ef;
		var a=ATable[FCH_FOCUS*f+FCH_HIT*h+FCH_CRIT*c]; // attack index
		//if (typeof tokensA.modifyattackroll!="undefined")
		//    n=tokensA.modifyattackroll(n,tokensD);
		fa=FCH_focus(n);
		ca=FCH_crit(n);
		ha=FCH_hit(n);
		for (ff=0; ff<=defense; ff++) {
		    for (ef=0; ef<=defense-ff; ef++) {
			var fd;
			var m=FE_FOCUS*ff+FE_EVADE*ef
			//if (typeof tokensD.modifydefenseroll!="undefined") 
			//    m=tokensD.modifydefenseroll(m);
			fd=FE_focus(m)
			evade=FE_evade(m);
			if (defense==0) d=1; else d=DTable[m]
			hit=ha;
			i=0;
			if (tokensD.evade>0) { evade+=1; }
			if (tokensD.focus>0) { evade+=fd; }
			if (tokensA.focus>0) { hit+=fa; }
			if (hit>evade) { i = FCH_HIT*(hit-evade); evade=0; } 
			else { evade=evade-hit; }
			if (ca>evade) { i+= FCH_CRIT*(ca-evade); }
			p[i]+=a*d;
		    }
		}
	    }
	}
    }
    for (h=0; h<=attack; h++) {
	for (c=0; c<=attack-h; c++) {
	    i=FCH_HIT*h+FCH_CRIT*c;
	    if (c+h>0) tot+=p[i];
	    //log("c"+c+" h"+h+" "+p[i]);
	    mean+=h*p[i];
	    meanc+=c*p[i];
	    // Max 3 criticals leading to 2 damages each...Proba too low anyway after that.
	    switch(c) {
	    case 0:
		for(j=1; j<=c+h; j++) k[j]+=p[i];
		break;
	    case 1:
		for(j=1; j<=c+h; j++) k[j]+=p[i]*(33-7)/33;
		for(j=2; j<=c+h+1; j++) k[j]+=p[i]*7/33;
		break;
	    default: 
		for(j=1; j<=c+h; j++) k[j]+=p[i]*(33-7)/33*(32-7)/32;
		for (j=2; j<=c+h+1; j++) k[j]+=p[i]*(7/33*(1-6/32)+(1-7/33)*7/32);
		for (j=3; j<=c+h+2; j++) k[j]+=p[i]*7/33*6/32;
	    }
	}
    }
    return {proba:p, tohit:Math.floor(tot*10000)/100, meanhit:tot==0?0:Math.floor(mean * 100) / 100,
	    meancritical:tot==0?0:Math.floor(meanc*100)/100,tokill:k} ;
}

function probatable(attacker,defender) {
    var i,j;
    var str="";
    for (i=0; i<=5; i++) {
	str+="<tr><td>"+i+"</td>";
	for (j=0; j<=5; j++) {
	    var k=j;
	    if (defender.adddice>0) k+=defender.adddice;
	    var th=tohitproba(attacker,defender,ATTACK[i],DEFENSE[k],i,k);
	    str+="<td class='probacell' style='background:hsl("+(1.2*(100-th.tohit))+",100%,80%)'>";
	    str+="<div>"+th.tohit+"%</div><div><code class='symbols'>d</code>"+th.meanhit+"</div><div><code class='symbols'>c</code>"+th.meancritical+"</div></td>";
	}
	str+="</tr>";
    }
    return str;
}
function fillprobatable() {
    var attacker={focus:$("#focusA").prop("checked")?1:0,
		  reroll:$("#targetA").prop("checked")?5:0};
    var defender={focus:$("#focusD").prop("checked")?1:0,
		  evade:$("#evadeD").prop("checked")?1:0,
		  adddice:$("#cloakD").prop("checked")?2:0,
		  reroll:0}
    //log("REROLL1:"+attacker.reroll);
    var ra;
    ra=parseInt($("#rerollA").val(),10);
    var rd=parseInt($("#rerollD").val(),10);
    //log("REROLL2:"+ra+"-"+$("#rerollA").val());
    if (attacker.reroll==0||(ra>0&&ra<attacker.reroll)) attacker.reroll=ra;
    if (defender.reroll==0||(rd>0&&rd<defender.reroll)) defender.reroll=rd;

    //log("REROLL "+ra);
    var str="<tr><th>Rolls</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>"+probatable(attacker,defender);
    $("#probatable").html(str);
}


function modal_dragstart(event) {
    var style = window.getComputedStyle(event.originalEvent.target, null);
    event.originalEvent.dataTransfer.setData("text/plain",
					     event.target.parentElement.id+","+
					     (parseInt(style.getPropertyValue("left"),10) - event.originalEvent.clientX) + ',' +
					     (parseInt(style.getPropertyValue("top"),10) - event.originalEvent.clientY));
} 
function modal_dragover(event) { 
    event.originalEvent.preventDefault(); 
    return false; 
} 
function modal_drop(event) { 
    var offset = event.originalEvent.dataTransfer.getData("text/plain").split(',');
    var id = offset[0];
    $("#"+id+" > div").css("left", (event.originalEvent.clientX + parseInt(offset[1],10)) + 'px');
    $("#"+id+" > div").css("top", (event.originalEvent.clientY + parseInt(offset[2],10)) + 'px');
    event.originalEvent.preventDefault();
    return false;
} 
var viewport_translate=function(dx,dy) {
    VIEWPORT.m=MT(dx,dy).add(VIEWPORT.m);
    $(".phasepanel").hide();
    VIEWPORT.transform(VIEWPORT.m);
}
    var viewport_zoom=function(z) {
	var w=$("#svgout").width();
	var h=$("#svgout").height();
	var offsetX=activeunit.m.x(0,0);
	var offsetY=activeunit.m.y(0,0);
	var vm=VIEWPORT.m.clone().invert();
	var x=vm.x(offsetX,offsetY);
	var y=vm.y(offsetX,offsetY);

	VIEWPORT.m.translate(x,y).scale(z).translate(-x,-y);
	VIEWPORT.transform(VIEWPORT.m);
	activeunit.show();
    }
	var dragmove=function(event) {
	    if (activeunit.dragged==true) return;
	    var e = event; // old IE support
	    var x=e.offsetX,y=e.offsetY;
	    if (VIEWPORT.dragged) {
		var w=$("#svgout").width();
		var h=$("#svgout").height();
		var max=Math.max(900./w,900./h);
		var ddx=(e.offsetX-VIEWPORT.x0)*max;
		var ddy=(e.offsetY-VIEWPORT.y0)*max;
		VIEWPORT.dragMatrix=MT(ddx,ddy).add(VIEWPORT.m);
		VIEWPORT.dragged=true;
		$(".phasepanel").hide();
		VIEWPORT.transform(VIEWPORT.dragMatrix);
	    }
	}
var dragstart=function(event) { 
    var e = event; // old IE support
    VIEWPORT.dragged=true;
    if (e.originalEvent.target.id == "svgout") {
	VIEWPORT.x0=e.offsetX;
	VIEWPORT.y0=e.offsetY;
	VIEWPORT.dragged=true; 
	VIEWPORT.dragMatrix=VIEWPORT.m;
    } else VIEWPORT.dragged=false;
}
var   dragstop= function(e) { 
    if (VIEWPORT.dragged) { 
	VIEWPORT.m=VIEWPORT.dragMatrix;
	VIEWPORT.m.clone();
	VIEWPORT.transform(VIEWPORT.m);
	activeunit.show();
    }
    VIEWPORT.dragged=false;
}
var scrolloverflow=function(event) {
    var id=event.target.id;
    $("#"+id+" .outoverflow").each(function(index) { 
	if ($(this).css("top")!="auto") {
	    $(this).css("top",$(this).parent().offset().top+"px");
	}
    });
}

var changelanguage= function(l) {
    localStorage['LANG']=l;
    //log("reloading "+l);
    location.reload();
}
$(document).ready(function() {
    s= Snap("#svgout")

    VIEWPORT = s.g().attr({id:"viewport"});
    VIEWPORT.m=new Snap.Matrix();

    P = { F0:{path:s.path("M 0 0 L 0 0").attr({display:"none"}), speed: 0, key:"5"},
	  F1:{path:s.path("M 0 0 L 0 -80").attr({display:"none"}), speed: 1, key:"8"},
	  F2:{path:s.path("M 0 0 L 0 -120").attr({display:"none"}), speed: 2, key:"8"},
	  F3:{path:s.path("M 0 0 L 0 -160").attr({display:"none"}), speed: 3, key:"8"},
	  F4:{path:s.path("M 0 0 L 0 -200").attr({display:"none"}), speed: 4, key:"8"},
	  F5:{path:s.path("M 0 0 L 0 -240").attr({display:"none"}), speed: 5, key: "8" },
	  // Turn right
	  TR1:{path:s.path("M0 0 C 0 -40 15 -55 55 -55").attr({display:"none"}), speed: 1, key:"6"},// 35 -35
	  TR2:{path:s.path("M0 0 C 0 -50 33 -83 83 -83").attr({display:"none"}), speed:2, key:"6"},// 63 -63
	  TR3:{path:s.path("M0 0 C 0 -60 45 -105 105 -105").attr({display:"none"}), speed:3, key:"6"}, // 85 -85
	  TRR3:{path:s.path("M0 0 C 0 -60 45 -105 105 -105").attr({display:"none"}), speed:3, key:";"}, // 85 -85
	  // Turn left
	  TL1:{path:s.path("M0 0 C 0 -40 -15 -55 -55 -55").attr({display:"none"}), speed:1, key:"4"}, // -35 -35
	  TL2:{path:s.path("M0 0 C 0 -50 -33 -83 -83 -83").attr({display:"none"}), speed:2, key:"4"},// -63 -63
	  TL3:{path:s.path("M0 0 C 0 -60 -45 -105 -105 -105").attr({display:"none"}), speed:3, key:"4"}, // -85 -85
	  TRL3:{path:s.path("M0 0 C 0 -60 -45 -105 -105 -105").attr({display:"none"}), speed:3, key:":"}, // -85 -85
	  // Bank right
	  BR1:{path:s.path("M0 0 C 0 -20 18 -72 38 -92").attr({display:"none"}), speed:1, key:"9"}, // 24 -58 (+/-14.14)
	  BR2:{path:s.path("M0 0 C 0 -30 24 -96 54 -126").attr({display:"none"}), speed:2, key:"9"}, // 40 -92 (+/-14.14)
	  SR2:{path:s.path("M0 0 C 0 -30 24 -96 54 -126").attr({display:"none"}), speed:2, key:"3"}, // 40 -92 (+/-14.14)
	  BR3:{path:s.path("M0 0 C 0 -40 29 -120 69 -160").attr({display:"none"}), speed:3, key:"9"}, // 55 -126 (+/-14.14)
	  SR3:{path:s.path("M0 0 C 0 -40 29 -120 69 -160").attr({display:"none"}), speed:3, key:"3"}, // 55 -126 (+/-14.14)
	  // Bank left
	  BL1:{path:s.path("M0 0 C 0 -20 -18 -72 -38 -92").attr({display:"none"}), speed:1, key:"7"}, // 24 -58 (+/-14.14)
	  BL2:{path:s.path("M0 0 C 0 -30 -24 -96 -54 -126").attr({display:"none"}), speed:2, key:"7"}, // 40 -92 (+/-14.14)
	  SL2:{path:s.path("M0 0 C 0 -30 -24 -96 -54 -126").attr({display:"none"}), speed:2, key:"1"}, // 40 -92 (+/-14.14)
	  BL3:{path:s.path("M0 0 C 0 -40 -29 -120 -69 -160").attr({display:"none"}), speed:3, key:"7"}, // 55 -126 (+/-14.14)
	  SL3:{path:s.path("M0 0 C 0 -40 -29 -120 -69 -160").attr({display:"none"}), speed:3, key:"1"}, // 55 -126 (+/-14.14)
	  // K turns (similar to straight line, special treatment in move function)
	  K1:{path:s.path("M 0 0 L 0 -80").attr({display:"none"}), speed: 1, key:"2"},
	  K2:{path:s.path("M 0 0 L 0 -120").attr({display:"none"}), speed: 2, key:"2"},
	  K3:{path:s.path("M 0 0 L 0 -160").attr({display:"none"}), speed: 3, key:"2"},
	  K4:{path:s.path("M 0 0 L 0 -200").attr({display:"none"}), speed: 4, key:"2"},
	  K5:{path:s.path("M 0 0 L 0 -240").attr({display:"none"}), speed: 5, key: "2" }
	};
    // Load unit data
    var availlanguages=["en","fr","de","es","it","pl"];
    LANG = localStorage['LANG'] || window.navigator.userLanguage || window.navigator.language;
    LANG=LANG.substring(0,2);
    $.ajaxSetup({beforeSend: function(xhr){
	if (xhr.overrideMimeType)
	    xhr.overrideMimeType("application/json");
    }});
    if (availlanguages.indexOf(LANG)==-1) LANG="en";
    $("#langselect").val(LANG);
    $.when(
	$.ajax("data/ships.json"),
	$.ajax("data/strings."+LANG+".json"),
	$.ajax("data/xws.json")
    ).done(function(result1,result2,result3) {
	var process=setInterval(function() {
	    ATTACK[dice]=attackproba(dice);
	    DEFENSE[dice]=defenseproba(dice);
	    dice++;
	    if (dice==8) {
		fillprobatable();
		$("#showproba").prop("disabled",false);
		clearInterval(process);}
	},500);
	unitlist=result1[0];
	SHIP_translation=result2[0].ships;
	PILOT_translation=result2[0].pilots;
	UPGRADE_translation=result2[0].upgrades;
	UI_translation=result2[0].ui;
	CRIT_translation=result2[0].criticals;
	var css_translation=result2[0].css;
	var str="";
	for (var i in css_translation) {
	    str+="."+i+"::after { content:\""+css_translation[i]+"\";}\n";
	}
	$("#localstrings").html(str);

	UPGRADE_dict=result3[0].upgrades;
	PILOT_dict=result3[0].pilots;

	for (var j in PILOT_dict) {
	    for (var i=0; i<PILOTS.length; i++) 
		if (PILOTS[i].name==PILOT_dict[j]) PILOTS[i].dict=j;
	    for (var i in unitlist) 
		if (i==PILOT_dict[j]) unitlist[i].dict=j;
	}
	/*Sanity check */
	
	for (var i=0; i<PILOTS.length; i++) {
	    var found=false;
	    for (var j in PILOT_dict) 
		if (PILOTS[i].name==PILOT_dict[j]) { found=true; break; }
	    if (!found) log("no xws translation for "+PILOTS[i].name);
	}
	for (var i=0; i<UPGRADES.length; i++) {
	    var found=false;
	    for (var j in UPGRADE_dict) 
		if (UPGRADES[i].name==UPGRADE_dict[j]) { found=true; break; }
	    if (!found) log("no xws translation for "+UPGRADES[i].name);
	}

	var r=0,e=0,i;
	squadron=[];

	s.attr({width:"100%",height:"100%",viewBox:"0 0 900 900"});
	TEAMS[1].setfaction("REBEL");
	TEAMS[2].setfaction("EMPIRE");
	//TEAMS[1].selectrocks();
	//TEAMS[2].selectrocks();
	/*UPGRADES.sort(function(a,b) {
	    var an=a.name;
	    var bn=b.name;
	    if (typeof UI_translation[an]!="undefined"&&typeof UI_translation[an].name!="undefined") an=UI_translation[a.name].name;
	    if (typeof UI_translation[bn]!="undefined"&&typeof UI_translation[bn].name!="undefined") bn=UI_translation[b.name].name;
	    var u1=an+a.type;
	    var u2=bn+b.name;
	    return u1.localeCompare(u2);
	});
	PILOTS.sort(function(a,b) { 
		var d=a.points-b.points;
		if (d==0) return a.name.localeCompare(b.name);
		else return d;
	    });*/

	

	var n=0,u=0,ut=0;
	var str="";
	for (i=0; i<PILOTS.length; i++) {
	    if (PILOTS[i].done==true) { if (PILOTS[i].unique) u++; n++; }
	    if (!PILOTS[i].done) { 
		if (PILOTS[i].unique) str+=", ."; else str+=", ";
		str+=PILOTS[i].name; 
	    }
	}
	log(n+"/"+PILOTS.length+" pilots with full effect");
	if (str!="") log("Pilots NOT implemented"+str);
	n=0;
	str="";
	for (i=0; i<UPGRADES.length; i++) {
	    if (UPGRADES[i].done==true) n++;
	    else str+=", "+(UPGRADES[i].unique?".":"")+UPGRADES[i].name;
	}
	$(".ver").html(VERSION);
	log(n+"/"+UPGRADES.length+" upgrades implemented");
	log("Upgrades NOT implemented"+str);
	$("#showproba").prop("disabled",true);
	var d=new Date();

	if (typeof localStorage.volume=="undefined") localStorage.volume=0.8;

	Howler.volume(localStorage.volume);
	$("#vol").val(localStorage.volume*100);

	var mc= new Hammer(document.getElementById('svgout'));
	mc.get("pinch").set({enable:true});
	mc.get('pan').set({direction:Hammer.DIRECTION_ALL});
	mc.on("panleft panright panup pandown",function(ev) {
	    if (ev.target.id!="svgout") {return;}
	    if (activeunit.dragged==true) return;
	    viewport_translate(-ev.velocityX*50,-ev.velocityY*50);
	});

	TEMPLATES["unit-creation"]=$("#unit-creation").html();
	Mustache.parse(TEMPLATES["unit-creation"]);  
	TEMPLATES["faction"]=$("#faction").html();
	Mustache.parse(TEMPLATES["faction"]);  
	TEMPLATES["usabletokens"]=$("#usabletokens").html();
	Mustache.parse(TEMPLATES["usabletokens"]);  
	
	mc.zoom=1;
	mc.on("pinch",function(ev) {
	    if (ev.target.id!="svgout") { return;}
	    if (activeunit.dragged==true) return;
	    var vm=VIEWPORT.m.clone().invert();
	    var x=vm.x(ev.center.x,ev.center.y);
	    var y=vm.y(ev.center.x,ev.center.y);
	    VIEWPORT.m.translate(x,y).scale(ev.scale).scale(1/mc.zoom).translate(-x,-y);
	    mc.zoom=ev.scale;
	    VIEWPORT.transform(VIEWPORT.m);
	    activeunit.show();
	    if (ev.final) mc.zoom=1;
	});
	$("aside").on("scroll touchmove touchstart mousewheel", scrolloverflow);

    $("#squadbattle").html("<thead><tr><th><span class='m-score'></span></th><th><span class='m-opponent'></span></th></tr></thead>");
    SQUADBATTLE=$("#squadbattle").DataTable({
	"language": {
	    "search":UI_translation["Search"],
	    "lengthMenu": UI_translation["Display _MENU_ records per page"],
	    "zeroRecords": UI_translation["Nothing found - sorry"],
	    "info": UI_translation["Showing page _PAGE_ of _PAGES_"],
	    "infoEmpty": UI_translation["No records available"],
	    "infoFiltered": UI_translation["(filtered from _MAX_ total records)"]
	},
	"autoWidth": true,
	"scrollY": "20em",
	"scrollX":true,
	"deferRender": true,
	"scrollCollapse": true,
	"ordering":true,
	"processing":true,
	"info":true,
	"paging":         true});

	$('#squadbattle tbody').on('click','tr', function () {
            if ( $(this).hasClass('selected') ) {
		$(this).removeClass('selected');
            }
            else {
		$("#squadbattle tr.selected").removeClass("selected");
		$(this).addClass('selected');
            }
	} );
	$("#player1").html("<option selected value='human'>"+UI_translation["human"]+"</option>");
	$("#player1").append("<option value='computer'>"+UI_translation["computer"]+"</option>");
	$("#player2").html("<option selected value='human'>"+UI_translation["human"]+"</option>");
	$("#player2").append("<option value='computer'>"+UI_translation["computer"]+"</option>");

	var arg=LZString.decompressFromEncodedURIComponent(decodeURI(window.location.search.substr(1)));
	var args=[];
	if (arg!=null) args= arg.split('&');
	if (args.length>1) {
	    log("Loading permalink...");
	    ROCKDATA=args[2];
	    phase=CREATION_PHASE;
	    TEAMS[1].parseASCII(args[0]);
	    TEAMS[1].toJSON(); // Just for points
	    TEAMS[2].parseASCII(args[1]);
	    TEAMS[2].toJSON(); // Just for points
	    TEAMS[1].isia=false;
	    TEAMS[2].isia=false;
	    if (args[3]=="true") { $("#player1 option[value='computer']").prop("selected",true); TEAMS[1].isia=true;}
	    else $("#player1 option[value='human']").prop("selected",true);
	    if (args[4]=="true") { $("#player2 option[value='computer']").prop("selected",true); TEAMS[2].isia=true; }
	    else $("#player2 option[value='human']").prop("selected",true);
	    SETUP=SETUPS[args[5]+" Map"];
	    phase=SELECT_PHASE;
	    if (args.length>6&args[6]!="") { REPLAY=args[6]; }
	    PERMALINK=LZString.compressToEncodedURIComponent(TEAMS[1].toASCII()+"&"+TEAMS[2].toASCII()+"&"+saverock()+"&"+TEAMS[1].isia+"&"+TEAMS[2].isia+"&"+args[5]);
	    return nextphase();
	} else {
	    phase=0;
	    nextphase();
	    if (args.length==1) {
		if ($("#squad1").val()=="") currentteam=TEAMS[1];
		else currentteam=TEAMS[2];
		currentteam.parseJSON(args[0]);
		endselection();
	    }

	    SETUP = SETUPS["Classic Map"];

	    $("#squadlist").html("<thead><tr><th></th><th>"+UI_translation["type"]+"</th><th><span class='m-points'></span></th><th><span class='m-units'></span></th><th></th><th></th><th></th></tr></thead>");
	    $.fn.dataTable.ext.search.push(
		function( settings, data, dataIndex ) {
		    return data[1].search(stype)>-1;
		}
	    );
	    var first=0;
	    SQUADLIST=$("#squadlist").DataTable({
		"language": {
		    "search":UI_translation["Search"],
		    "lengthMenu": UI_translation["Display _MENU_ records per page"],
		    "zeroRecords": UI_translation["Nothing found - sorry"],
		    "info": UI_translation["Showing page _PAGE_ of _PAGES_"],
		    "infoEmpty": UI_translation["No records available"],
		    "infoFiltered": UI_translation["(filtered from _MAX_ total records)"]
		},
		"autoWidth": true,
		"columnDefs": [
		    { "targets": [0],
		      "render":function() {
			  return "<span class='closemiddle' onclick='removerow($(this))'>&times;</span> "
		      },
		      "sortable":false
		    },
		    { "targets":[6],
		      "width":"2em",
		      "render":function() {
			  return "<span class='squadtop'><span class='squadmiddle' onclick='checkrow(1,$(this))'>1</span>&nbsp;<span class='squadmiddle right' onclick='checkrow(2,$(this))'>2</span></span>";
		      },
		      "sortable":false
		    },
		    { "targets":[5],
		      "render":function(d,c,row) {
			  return "<span class='logmiddle symbols' onclick='battlelog($(this));'>&#xE9;</span>";
		      },
		      "sortable":false
		    },
		    { "targets":[1],
		      "sortable":false,
		      "render":function(data,type,row) {
			  if (row[4].search("SQUAD")>-1)
			      return "<span style='display:none'>"+data+" USER</span><span class='"+data+"'></span>";
			  else if (row[4]=="ELITE") 
			      return "<span style='display:none'>"+data+" ELITE</span><span class='"+data+"'></span><span style='font-size:larger'></span><code style='color:orange' class='symbols'>ï</code>";
			  return "<span style='display:none'>"+data+" PREBUILT</span><span class='"+data+"'></span><code style='font-size:larger' class='symbols'>ì</code>";
			  
		      }
		    },
		    {
			"targets": [ 4 ],
			"visible": false,
			"searchable": false
		    },
		    {   "targets":[3],
			"render": function ( data, type, row ) {
			    if (LANG!="en"&&phase==SELECT_PHASE) 
				if (row[4].search("SQUAD")==-1) {
				    TEAMS[0].parseJuggler(data,false);
				    data=TEAMS[0].toJuggler(true);
				}
			    return data.replace(/\n/g,"<br>");
			}
		    }],   
		"ajax": "data/full4b.json",
		"scrollY":        "20em",
		"scrollCollapse": true,
		"deferRender": true,
		"ordering":true,
		"info":true,
		"paging":         true});


	    for (i in localStorage) {
		if (typeof localStorage[i]=="string"&&i.match(/SQUAD.*/)) {
		    //delete localStorage[i];
		    var l=$.parseJSON(localStorage[i]);
		    if (typeof l.jug=="undefined"||typeof l.pts=="undefined")
			delete localStorage[i]
		    else {
			if (LANG!="en") { 
			    TEAMS[0].parseJuggler(l.jug,false); 
			    addrow(0,i,l.pts,l.faction,TEAMS[0].toJuggler(true),true); 
			} else {
			    addrow(0,i,l.pts,l.faction,l.jug,true);
			}
		    }
		}
	    }
	    $("#squadlist tr:first-child .squadtop").attr("data-intro","Select squad").attr("data-position","bottom");
	    $("#squadlist tr:first-child .logmiddle").attr("data-intro",'Battle log').attr("data-position",'left'); 
	}
	var pilots=[];
	for (i=0; i<PILOTS.length; i++) {
	    var n=i;
	    var name=translate(PILOTS[i].name);
	    if (PILOTS[i].ambiguous==true) name+="("+PILOTS[i].unit+")";
	    pilots.push(name.replace(/\'/g,"").replace(/\(Scum\)/g,""));
	}
	var upgrades=[];
	for (i in UPGRADE_translation) {
	    upgrades.push(translate(i).replace(/\'/g,"").replace(/\(Crew\)/g,""));
	}
	$(".squadbg > textarea").asuggest(pilots, { 'delimiters': '^\n', 'cycleOnTab': true });
	$(".squadbg > textarea").asuggest(upgrades, { 'delimiters': '+ ', 'cycleOnTab':true});
    });
});
var cmd=[];
var startreplayall=function() {
    if (REPLAY.length==0) return; 
    cmd=REPLAY.split("_");
    cmd.splice(0,1);
    if (cmd.length==0) return;
    ZONE[1].remove();
    ZONE[2].remove();
    $(".nextphase").prop("disabled",true);
    $(".unit").css("cursor","pointer");
    actionrlock=$.Deferred();
    actionrlock.progress(replayall);
    $("#positiondial").hide();
    //for (var j in squadron) console.log("squadron["+j+"]:"+squadron[j].name+" "+squadron[j].id);
    replayall();
}
var stopreplay=function() {
    actionrlock=$.Deferred();
}
var restartreplay=function() {
    actionrlock=$.Deferred();
    actionrlock.progress(replayall);
    replayall();
}
var replayall=function() {
    var c=cmd[0].split("-");
    console.log(cmd[0]);
    cmd.splice(0,1);
    var u=null;
    var j;
    if (c[0].length>0) {
	var id=parseInt(c[0],10);
	for (j in squadron) if (squadron[j].id==id) break; 
	if (squadron[j].id==id) u=squadron[j];
	else {
	    console.log("cannot find id "+id);
	    //for (j in squadron) console.log("squadron["+j+"]="+squadron[j].name);
	    actionrlock.notify();
	    return;
	}
    } 
    //if (u!=null) log("cmd : "+u.name+" "+c[1]);
    var FTABLE={"fo":"removefocustoken",
		"FO":"addfocustoken",
		"e":"removeevadetoken",
		"E":"addevadetoken",
		"ct":"removecloaktoken",
		"CT":"addcloaktoken",
		"i":"removeiontoken",
		"I":"addiontoken",
		"tb":"removetractorbeamtoken",
		"TB":"addtractorbeamtoken",
		"ST":"addstress",
		"DPY":"deploy",
		"st":"removestresstoken",
		"d":"dies",
	   };
    if (typeof FTABLE[c[1]]=="string") {
	var f=Unit.prototype[FTABLE[c[1]]];
	if (typeof f=="undefined") log("ftable "+c[1]+" "+FTABLE[c[1]]);
	if (typeof f.vanilla=="function") f.vanilla.call(u,t);
	else f.call(u);
	actionrlock.notify();
	return;
    }
    switch(c[1]) {
    case "P": 
	var p=phase;
	round=parseInt(c[2],10);
	phase=parseInt(c[3],10);
	if (p>phase) {
	    for (var i in squadron) {
		var u=squadron[i];
		u.focus=u.evade=0;
		u.showinfo();
	    }
	}
	$("#phase").html(UI_translation["turn #"]+round+" "+UI_translation["phase"+phase]);
	actionrlock.notify();
	break;
    case "t": 
	for (j in squadron) 
	    if (squadron[j].id==parseInt(c[2],10)) break;
	if (squadron[j].id!=parseInt(c[2],10)) {
	    console.log("cannot find target "+c[2]);
	    actionrlock.notify();
	    break;
	}
	var t=squadron[j];
	if (typeof Unit.prototype.removetarget.vanilla=="function") 
	    Unit.prototype.removetarget.vanilla.call(u,t);
	else Unit.prototype.removetarget.call(u,t);
	actionrlock.notify();
	break;
    case "T":
	for (j in squadron) 
	    if (squadron[j].id==parseInt(c[2],10)) break;
	if (squadron[j].id!=parseInt(c[2],10)) {
	    console.log("cannot find target "+c[2]);
	    actionrlock.notify();
	    break;
	}
	var t=squadron[j];
	if (typeof Unit.prototype.addtarget.vanilla=="function") 
	    Unit.prototype.addtarget.vanilla.call(u,t);
	else Unit.prototype.addtarget.call(u,t);
	actionrlock.notify();
	break;
    case "s": Unit.prototype.removeshield.call(u,parseInt(c[2],10)); 
	u.show();
	actionrlock.notify();
	break;
    case "S": Unit.prototype.addshield.call(u,parseInt(c[2],10));
	u.show();
	actionrlock.notify();
	break;
    case "h": Unit.prototype.removehull.call(u,parseInt(c[2],10));
	u.show();
	actionrlock.notify();
	break;
    case "H": Unit.prototype.addhull.call(u,parseInt(c[2],10));
	u.show();
	actionrlock.notify();
	break;
    case "d": u.dies(); 	
	actionrlock.notify();
	break;
    case "f": 		   
	u.select();
	for (j in squadron) 
	    if (squadron[j].id==parseInt(c[2],10)) break;
	if (squadron[j].id!=parseInt(c[2],10)) {
	    console.log("cannot find target unit "+c[2]);
	    actionrlock.notify();
	} else {
	    targetunit=squadron[j];
	    u.activeweapon=parseInt(c[3],10);
	    if (!FAST) u.playfiresnd();
	    //u.log("fires on "+targetunit.name+" with "+u.weapons[u.activeweapon].name);
	    setTimeout(function() { actionrlock.notify(); }, (FAST?0:1000));
	}
	break;
    case "am": 
	u.select();
	u.m=(new Snap.Matrix()).translate(c[2]-300,c[3]-300).rotate(c[4],0,0);
	u.g.transform(u.m);
	u.geffect.transform(u.m);
	actionrlock.notify();
	break;
    case "c":
	(new Critical(u,parseInt(c[2],10))).faceup();
	actionrlock.notify();
	break;
    case "m":
	u.select();
	var d=c[2];
	var l=parseInt(c[4],10);
	var oldm=u.m;
	var path=P[d].path;
	SOUNDS[u.ship.flysnd].play();
	Snap.animate(0,l,function(value) {
	    var m=this.getmatrixwithmove(oldm,path,value);
	    this.g.transform(m);
	    this.geffect.transform(m);
	}.bind(u), TIMEANIM*l/200,mina.linear, function() {
	    this.m=this.getmatrixwithmove(oldm,path,l);
	    this.m.rotate(parseFloat(c[3]),0,0);
	    this.g.transform(this.m);
	    this.geffect.transform(this.m);
	    actionrlock.notify();
	}.bind(u));
	break;
    default: log("undefined cmd "+c[1]);
    }
}
