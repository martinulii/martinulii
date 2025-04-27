// subway.js
// Author: Cameron Davidson-Pilon
// Date: July, 2012
// License: MIT

// Dependencies: 
//   Paper.js (http://paperjs.org/)

// -----------------------------------------------------------------------------
//                         LLIBRERIA Subwayjs
// -----------------------------------------------------------------------------

// Mida dels nodes i línies (en píxels)
var NODE_SIZE        = 16;  // radi dels nodes
var INNER_NODE_SIZE  = 7;   // radi del cercle interior de l’estació
var CUR_NODE_SIZE    = 9;   // radi del cercle interior quan està seleccionat
var LINE_WIDTH       = 23;  // amplada de les línies entre estacions

// Fonts per als textos
var FONT_SIZE    = 16;
var TEXT_FONT    = 'Arial';
var FONT_COLOR   = 'black';

var CHARACTER_STYLE = {
    fillColor: FONT_COLOR,
    fontSize: FONT_SIZE,
    font: TEXT_FONT,
};

// Emmagatzema tots els nodes per a interacció
var nodes     = [];
var shiftDown = 0;  // per detectar si SHIFT està premut

// Constructor de línia
function Line(color, name) {
    this.color = color;
    this.path  = new Path();
    this.path.strokeWidth = LINE_WIDTH;
    this.path.strokeColor = this.color;
    this.name  = name;
}

// Constructor d’una estació simple
function SingleNode(line, position, neighbours, name, url, name_offset, name_angle) {
    this.line        = line;
    this.position    = position;
    this.name        = name;
    this.url         = url || '';
    this.name_angle  = name_angle || 0;
    this.neighbours  = neighbours || {};
    nodes.push(this);

    this.onkeydownNode = onkeydownNode;
    this.fillNode      = function() { this.ic.fillColor = 'black'; };
    this.emptyNode     = function() { this.ic.fillColor = 'white'; };

    // Dibuixa el cercle exterior
    var c = new Path.Circle(this.position, NODE_SIZE);
    c.fillColor = this.line.color;
    // Crea l’anella interior
    var icOutline = new Path.Circle(this.position, INNER_NODE_SIZE + 2);
    icOutline.fillColor = 'black';
    this.ic = new Path.Circle(this.position, INNER_NODE_SIZE);
    this.ic.fillColor = 'white';

    // Text de la llegenda
    this.text = new PointText(this.position.add(name_offset));
    this.text.content = this.name;
    this.text.characterStyle = CHARACTER_STYLE;
    this.text.rotate(-this.name_angle, this.position);

    // Afegeix punt a la ruta de la línia
    this.line.path.add(this.position);
}

// Constructor d’una estació de transició (2 línies)
function TransitionNode(line1, line2, angle, position, neighbours, name, url, name_offset, name_angle) {
    var STROKE_WIDTH = 2;
    var CIRCLE_DIST  = 16;

    this.line       = line1;
    this.line2      = line2;
    this.position   = position;
    this.neighbours = neighbours || {};
    this.angle      = angle;
    this.positionAlt = this.position.add(
      new Point(CIRCLE_DIST * Math.cos(angle),
                CIRCLE_DIST * Math.sin(angle))
    );
    this.name       = name;
    this.url        = url || '';
    nodes.push(this);

    this.onkeydownNode = onkeydownNode;
    this.emptyNode     = function() { this.innerc.fillColor = this.line.path.strokeColor; };
    this.fillNode      = function() { this.innerc.fillColor = 'black'; };

    // Text
    this.text = new PointText(this.position.add(name_offset));
    this.text.content = this.name;
    this.text.characterStyle = CHARACTER_STYLE;
    this.text.rotate(-name_angle, this.position);

    // Segon cercle
    var c2 = new Path.Circle(this.positionAlt, NODE_SIZE);
    c2.strokeWidth = STROKE_WIDTH;
    c2.strokeColor = 'black';
    c2.fillColor   = 'white';
    new Path.Circle(this.positionAlt, CUR_NODE_SIZE + 1).fillColor = this.line2.color;

    // Primer cercle
    var c1 = new Path.Circle(this.position, NODE_SIZE);
    c1.strokeWidth = STROKE_WIDTH;
    c1.fillColor   = 'white';
    c1.strokeColor = 'black';
    this.innerc    = new Path.Circle(this.position, CUR_NODE_SIZE);
    this.innerc.fillColor = this.line.color;

    // Afegeix punts a ambdues línies
    this.line.path.add(this.position);
    this.line2.path.add(this.positionAlt);
}

// Llegenda (mostra un segment de línia amb nom)
function LegendItem(start, end, subwayLine) {
    this.line = new Line(subwayLine.color, subwayLine.name);
    this.line.path.add(start, end);
    var title = new PointText(end.add(new Point(7, 5)));
    title.content = subwayLine.name;
    title.characterStyle = {
        fillColor: 'black',
        fontSize: 14,
        font: TEXT_FONT
    };
}

// Gestió de teclat per moure’s entre estacions
function onKeyDown(event) {
    var key = event.key;
    if ((key == 'up' && shiftDown) || (key == 'w'))   current_position.onkeydownNode('N');
    else if ((key == 'left' && shiftDown) || (key == 'a')) current_position.onkeydownNode('W');
    else if ((key == 'right' && shiftDown) || (key == 'd')) current_position.onkeydownNode('E');
    else if ((key == 'down' && shiftDown) || (key == 's'))  current_position.onkeydownNode('S');
    else if (key == 'shift') shiftDown = 1;
}
function onKeyUp(event) {
    if (event.key == 'shift') shiftDown = 0;
}
function onkeydownNode(keydown) {
    for (var dir in this.neighbours) {
        if (dir == keydown) {
            current_position.emptyNode();
            current_position = this.neighbours[dir];
            current_position.fillNode();
            break;
        }
    }
}

// Línies discontínues
function DashLine(color, point1, point2) {
    this.color = color;
    this.path  = new Path();
    this.path.style = {
        strokeWidth: LINE_WIDTH,
        strokeColor: this.color
    };
    this.path.dashArray = [7, 4];
    this.path.add(point1, point2);
}

// Clique del ratolí per canviar estació
function onMouseDown(event) {
    for (var i = 0; i < nodes.length; i++) {
        if (Path.Circle(nodes[i].position, NODE_SIZE).bounds.contains(event.point)) {
            current_position.emptyNode();
            current_position = nodes[i];
            current_position.fillNode();
            break;
        }
    }
}

// Frame d’animació (halo)
function onFrame(event) {
    halo.strokeColor = current_position.line.color;
    halo.scale(Math.pow(1.04, Math.sin(event.count / 8)));
    halo.position = current_position.position;
}

// -----------------------------------------------------------------------------
//                         INICIALITZACIÓ (example de initialization_example.js)
// -----------------------------------------------------------------------------
// Creació de línies
//function SingleNode(line, position, neighbours, name, url, name_offset, name_angle)

// Línies
EducationLine = new Line('#fc7600', 'Education');
MusicLine     = new Line('#0dfc00', 'Music');
YoutubeLine   = new Line('#ff0000', 'Youtube');
BookLine = new Line('#f5a8f7', 'Book');


Timeline      = new DashLine('#000000', 'Timeline');

// Punts de referència
startPoint = new Point(100, 500); // start d'educació i música

//EDUCATION
educationNode1 = new SingleNode(EducationLine, startPoint, null, '', '', new Point(12, -20));
educationNode2 = new SingleNode(EducationLine, new Point(200, 400), null, 'Educació Obligatòria', '', new Point(0, -20), 30);
educationNode4 = new SingleNode(EducationLine, new Point(600, 400), null, 'Batxillerat Científic', '', new Point(0, -20), 30);
educationNode5 = new SingleNode(EducationLine, new Point(700, 400), null, 'Intel·ligència Artificial - UAB', '', new Point(0, -20), 30);
educationEnd = new SingleNode(EducationLine, new Point(1700, 400), null, '', '', new Point(0, -20), 30);

//MUSIC
musicNode1 = new SingleNode(MusicLine,     startPoint, null, '', '', new Point(12, 20));
musicNode2 = new SingleNode(MusicLine, new Point(200, 600), null, 'El Musical', '', new Point(20, -10), 30);
musicNode3 = new SingleNode(MusicLine, new Point(400, 600), null, 'Particular \n Martí Hosta', '', new Point(20, -20), 30);
musicNode4 = new SingleNode(MusicLine, new Point(700, 600), null, 'Taller de Músics', 'https://tallerdemusics.com', new Point(20, -5), 30);
musicEnd = new SingleNode(MusicLine, new Point(1700, 600), null, '', '', new Point(0, -20), 30);

//BOOK
bookNode1 = new SingleNode(BookLine, startPoint, null, '', '', new Point(12, 20));
bookNode2 = new SingleNode(BookLine, new Point(800, 500), null, 'Trencall', '', new Point(12, -20), 30);

// Youtube Line
var connector = new Path();
connector.strokeColor = YoutubeLine.color;
connector.strokeWidth = LINE_WIDTH;
connector.add(new Point(600, 600), new Point(700, 700)); 

youtubeNode1 = new SingleNode(YoutubeLine, new Point(700, 700), null, 'Youtube', '', new Point(10, -20), 30);
youtubeEnd = new SingleNode(YoutubeLine, new Point(1700, 700), null, '', '', new Point(0, -20), 30);

// Timeline (amb 2025 al centre a x=800)
timeline_05 = new SingleNode(Timeline, new Point(100, 850), null, '2005', '', new Point(0, -20));
timeline_11 = new SingleNode(Timeline, new Point(200, 850), null, '2011', '', new Point(0, -20));
timeline_17 = new SingleNode(Timeline, new Point(400, 850), null, '2017', '', new Point(0, -20));
timeline_21 = new SingleNode(Timeline, new Point(600, 850), null, '2021', '', new Point(0, -20));
timeline_23 = new SingleNode(Timeline, new Point(700, 850), null, '2023', '', new Point(0, -20));
timeline_25 = new SingleNode(Timeline, new Point(800, 850), null, '2025', '', new Point(0, -20));

// Assignació de veïns
educationNode1.neighbours = { 'E': educationNode2 };
educationNode2.neighbours = { 'W': educationNode1, 'E': educationNode3 };
educationNode3.neighbours = { 'W': educationNode2, 'E': educationNode4 };
educationNode4.neighbours = { 'W': educationNode3, 'E': educationNode5 };
educationNode5.neighbours = { 'W': educationNode4, 'E': educationNode6 };

musicNode1.neighbours = { 'E': musicNode2 };
musicNode2.neighbours = { 'W': musicNode1, 'E': musicNode3 };
musicNode3.neighbours = { 'W': musicNode2, 'E': musicNode4 };
musicNode4.neighbours = { 'W': musicNode3, 'E': musicNode5 };
musicNode5.neighbours = { 'W': musicNode4, 'E': musicNode6 };

musicNode4.neighbours['S'] = youtubeNode1; // connexió cap a Youtube

youtubeNode1.neighbours = { 'N': musicNode4, 'E': youtubeNode2 };
youtubeNode2.neighbours = { 'W': youtubeNode1 };

// Estació inicial i halo
current_position = educationNode1;
current_position.fillNode();
halo = new Path.Circle(current_position.position, NODE_SIZE);
halo.strokeColor = current_position.line.color;
halo.strokeWidth = 3;

// Llegenda
var p     = new Point(20,140);
var lgnt  = new Point(60,0);
var btw   = new Point(0,25);
new LegendItem(    p,            p.add(lgnt), EducationLine);
new LegendItem(p.add(btw),   p.add(btw).add(lgnt), MusicLine);

// Títol del mapa
var title = new PointText(new Point(20, 55));
title.content = "Timeline";
title.characterStyle = {
    fillColor: 'black',
    fontSize: 28,
    font: TEXT_FONT
};