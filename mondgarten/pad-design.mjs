// Simple pictograms stay readable on small screens without relying on emoji fonts.
export function padIcon(pad) {
  if (pad.id.startsWith("tool:"))
    return { reach: "sickle", bag: "bag", speed: "boot", value: "coin" }[
      pad.id.slice(5)
    ];
  if (pad.kind === "hive") return "honey";
  if (pad.kind === "workshop")
    return { bouquet: "flower", tea: "cup", oil: "bottle", elixir: "potion" }[
      pad.id.slice(9)
    ];
  if (pad.kind === "seed") return "seed";
  if (pad.kind === "bed")
    return (
      { 3: "mushroom", 4: "tree", 5: "gem", 6: "sun" }[
        Number(pad.id.slice(4))
      ] ?? "flower"
    );
  return (
    {
      snail: "snail",
      snailLevel: "snail",
      farm: "snail",
      warehouse: "crate",
      composter: "house",
      sprinkler: "water",
      partner: "house",
      endDay: pad.icon === "✧" ? "seed" : "water",
      bus: "bus",
    }[pad.id] ?? "star"
  );
}
export function drawPadIcon(c, icon, color = "#fffbea") {
  c.save();
  c.translate(256, 256);
  c.scale(3.5, 3.5);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 5;
  c.lineCap = "round";
  c.lineJoin = "round";
  const line = (points, close = false) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (close) c.closePath();
    c.stroke();
  };
  const circle = (x, y, r, fill = false) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    fill ? c.fill() : c.stroke();
  };
  const rect = (x, y, w, h) => {
    c.beginPath();
    c.roundRect(x, y, w, h, 5);
    c.stroke();
  };
  switch (icon) {
    case "gem":
      line(
        [
          [0, -25],
          [22, -7],
          [16, 22],
          [-16, 22],
          [-22, -7],
        ],
        true,
      );
      line([
        [-22, -7],
        [22, -7],
        [0, 22],
        [-22, -7],
      ]);
      break;
    case "honey":
      line(
        [
          [-19, -17],
          [19, -17],
          [19, 22],
          [-19, 22],
        ],
        true,
      );
      line(
        [
          [-23, -23],
          [23, -23],
          [23, -17],
          [-23, -17],
        ],
        true,
      );
      circle(0, 3, 9);
      break;
    case "sickle":
      c.beginPath();
      c.arc(-5, -10, 27, -2.6, 1.2);
      c.stroke();
      line([
        [5, 14],
        [27, 37],
      ]);
      break;
    case "bag":
      rect(-28, -20, 56, 58);
      c.beginPath();
      c.arc(0, -20, 14, Math.PI, Math.PI * 2);
      c.stroke();
      rect(-16, 7, 32, 20);
      break;
    case "boot":
      line(
        [
          [-21, -34],
          [5, -34],
          [5, 9],
          [30, 17],
          [36, 31],
          [36, 36],
          [-26, 36],
          [-26, 10],
          [-21, -34],
        ],
        true,
      );
      line([
        [-20, -14],
        [0, -14],
      ]);
      break;
    case "coin":
      circle(0, 0, 35);
      circle(0, 0, 26);
      line(
        [
          [0, -19],
          [5, -5],
          [19, 0],
          [5, 5],
          [0, 19],
          [-5, 5],
          [-19, 0],
          [-5, -5],
        ],
        true,
      );
      break;
    case "snail":
      circle(-7, -4, 27);
      c.beginPath();
      for (let i = 0; i < 80; i++) {
        const a = (i / 79) * Math.PI * 4,
          r = 19 * (1 - i / 90),
          x = -7 + Math.cos(a) * r,
          y = -4 + Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      line([
        [-37, 28],
        [26, 28],
        [37, 17],
        [35, 0],
      ]);
      line([
        [29, 1],
        [25, -14],
      ]);
      line([
        [36, 0],
        [43, -13],
      ]);
      circle(25, -17, 3, true);
      circle(44, -16, 3, true);
      break;
    case "crate":
      rect(-34, -30, 68, 60);
      line([
        [-33, -11],
        [33, -11],
      ]);
      line([
        [-33, 10],
        [33, 10],
      ]);
      line([
        [-20, -29],
        [-20, 29],
      ]);
      line([
        [20, -29],
        [20, 29],
      ]);
      break;
    case "house":
      line([
        [-39, -4],
        [0, -36],
        [39, -4],
      ]);
      line([
        [-28, -10],
        [-28, 34],
        [28, 34],
        [28, -10],
      ]);
      rect(-9, 9, 18, 25);
      break;
    case "flower":
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        circle(Math.cos(a) * 18, Math.sin(a) * 18 - 8, 11);
      }
      circle(0, -8, 8, true);
      line([
        [0, 16],
        [0, 38],
      ]);
      line([
        [0, 29],
        [-18, 18],
      ]);
      line([
        [0, 29],
        [18, 18],
      ]);
      break;
    case "tree":
      circle(0, -14, 25);
      circle(-20, -2, 18);
      circle(20, -2, 18);
      line([
        [0, 8],
        [0, 38],
      ]);
      line([
        [-16, 38],
        [16, 38],
      ]);
      break;
    case "mushroom":
      c.beginPath();
      c.arc(0, -2, 34, Math.PI, Math.PI * 2);
      c.closePath();
      c.stroke();
      rect(-11, -2, 22, 38);
      circle(-14, -15, 4, true);
      circle(12, -23, 5, true);
      break;
    case "sun":
      circle(0, 0, 21);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        line([
          [Math.cos(a) * 29, Math.sin(a) * 29],
          [Math.cos(a) * 39, Math.sin(a) * 39],
        ]);
      }
      break;
    case "seed":
      c.beginPath();
      c.ellipse(0, 3, 22, 33, 0.55, 0, Math.PI * 2);
      c.stroke();
      line([
        [-12, 26],
        [13, -21],
      ]);
      break;
    case "water":
      rect(-30, -12, 43, 41);
      line([
        [13, 10],
        [36, -12],
        [42, -7],
        [20, 24],
      ]);
      c.beginPath();
      c.arc(-30, 4, 18, Math.PI / 2, Math.PI * 1.5);
      c.stroke();
      line([
        [-19, -16],
        [-19, -28],
        [0, -28],
        [0, -16],
      ]);
      break;
    case "cup":
      rect(-30, -21, 49, 46);
      c.beginPath();
      c.arc(21, -2, 15, -Math.PI / 2, Math.PI / 2);
      c.stroke();
      line([
        [-34, 35],
        [30, 35],
      ]);
      line([
        [-13, -34],
        [-13, -28],
      ]);
      break;
    case "potion":
    case "bottle":
      line(
        [
          [-11, -33],
          [11, -33],
          [11, -10],
          [26, 12],
          [26, 32],
          [-26, 32],
          [-26, 12],
          [-11, -10],
          [-11, -33],
        ],
        true,
      );
      line([
        [-22, 13],
        [22, 13],
      ]);
      if (icon === "potion") {
        circle(-7, 21, 3, true);
        circle(8, 2, 4, true);
      }
      break;
    case "bus":
      rect(-33, -30, 66, 57);
      rect(-24, -20, 48, 24);
      circle(-19, 32, 7, true);
      circle(19, 32, 7, true);
      circle(-21, 15, 4, true);
      circle(21, 15, 4, true);
      break;
    default:
      line(
        [
          [0, -35],
          [10, -10],
          [36, -9],
          [17, 8],
          [23, 34],
          [0, 20],
          [-23, 34],
          [-17, 8],
          [-36, -9],
          [-10, -10],
        ],
        true,
      );
  }
  c.restore();
}
