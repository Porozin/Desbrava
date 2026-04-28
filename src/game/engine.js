import { QUESTOES_FE } from "./questions";

export const initGame = (element, user, onFinish) => {
  const Crafty = window.Crafty;
  if (!Crafty) return null;
  
  const width = element.clientWidth;
  const height = element.clientHeight;

  Crafty.init(width, height, element);
  
  const gameState = {
    mode: "exploration", 
    player: {
      name: user.displayName || "Caçador",
      emoji: user.photoURL && user.photoURL.length <= 4 ? user.photoURL : "🛡️",
      hp: 100,
      maxHp: 100,
      atk: 15,
      fe: 10,
      xp: user.xp || 0
    },
    currentEnemy: null,
    dungeonProgress: 0,
    maxProgress: 5
  };

  // --- COMPONENTES ---

  Crafty.c("GameButton", {
    init: function() {
      this.addComponent("2D, DOM, Color, Text, Mouse");
      this.attr({ w: Math.min(width * 0.8, 300), h: 54 });
      this.color("rgba(255, 255, 255, 0.05)");
      this.textColor("#fff");
      this.css({ 
        "border": "1px solid rgba(255,255,255,0.15)", 
        "border-radius": "16px", 
        "display": "flex", 
        "align-items": "center", 
        "justify-content": "center",
        "cursor": "pointer",
        "font-family": "'Outfit', sans-serif",
        "font-size": "16px",
        "font-weight": "600",
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
        "backdrop-filter": "blur(8px)",
        "transition": "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "box-shadow": "0 4px 12px rgba(0,0,0,0.2)"
      });
      this.bind("MouseOver", () => {
        this.color("rgba(255, 255, 255, 0.12)");
        this.css({ "transform": "translateY(-2px)", "border-color": "rgba(255,255,255,0.3)" });
      });
      this.bind("MouseOut", () => {
        this.color("rgba(255, 255, 255, 0.05)");
        this.css({ "transform": "translateY(0)", "border-color": "rgba(255,255,255,0.15)" });
      });
    },
    label: function(txt) {
      this.text(txt);
      return this;
    },
    variant: function(type) {
      if (type === "primary") {
        this.css({ "background": "linear-gradient(135deg, #3b82f6, #2563eb)", "border": "none" });
      } else if (type === "danger") {
        this.css({ "background": "linear-gradient(135deg, #ef4444, #dc2626)", "border": "none" });
      } else if (type === "warning") {
        this.css({ "background": "linear-gradient(135deg, #f59e0b, #d97706)", "border": "none", "color": "#000" });
      }
      return this;
    }
  });

  // Componente para Entidades (Player/Enemy)
  Crafty.c("Entity", {
    init: function() {
      this.addComponent("2D, DOM, Text");
      this.textFont({ size: '64px' });
      this.css({ "display": "flex", "align-items": "center", "justify-content": "center" });
    },
    setEmoji: function(e) {
      this.text(e);
      return this;
    },
    shake: function() {
      const originalX = this.x;
      this.bind("EnterFrame", function(frame) {
        if (frame.frame % 2 === 0) {
          this.x = originalX + (Math.random() * 10 - 5);
        }
        if (frame.frame > 30) this.unbind("EnterFrame");
      });
    }
  });

  // --- CENAS ---

  Crafty.scene("Loading", function() {
    Crafty.background("#020617");
    Crafty.e("2D, DOM, Text")
      .attr({ x: 0, y: height/2 - 20, w: width })
      .text("INVOCANDO A MASMORRA")
      .textColor("#3b82f6")
      .textFont({ size: '14px', weight: '800' })
      .textAlign("center")
      .css({ "letter-spacing": "0.3em" });
    
    setTimeout(() => Crafty.scene("Exploration"), 1200);
  });

  Crafty.scene("Exploration", function() {
    Crafty.background("radial-gradient(circle at center, #1e293b, #020617)");
    
    // Header Info
    const topBar = Crafty.e("2D, DOM, Color")
      .attr({ x: 0, y: 0, w: width, h: 60 })
      .color("rgba(0,0,0,0.3)");

    Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: 22, w: width - 40 })
      .text(`PROGRESSO: ${gameState.dungeonProgress}/${gameState.maxProgress}`)
      .textColor("rgba(255,255,255,0.5)")
      .textFont({ size: '11px', weight: '800' });

    if (gameState.dungeonProgress >= gameState.maxProgress) {
      Crafty.scene("Boss");
      return;
    }

    const titles = ["Bosque do Silêncio", "Caverna do Eco", "Trilha das Sombras", "Ruínas do Templo"];
    const icons = ["🌲", "🕳️", "🌑", "🏛️"];
    const index = gameState.dungeonProgress % titles.length;

    // Grande Icone de Exploração
    Crafty.e("2D, DOM, Text")
      .attr({ x: 0, y: height/4 - 40, w: width })
      .text(icons[index])
      .textFont({ size: '80px' })
      .textAlign("center");

    Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: height/4 + 60, w: width - 40 })
      .text(titles[index])
      .textColor("#fff")
      .textFont({ size: '28px', weight: '800' })
      .textAlign("center");

    Crafty.e("2D, DOM, Text")
      .attr({ x: 40, y: height/4 + 110, w: width - 80 })
      .text("A escuridão se fecha ao seu redor. Escolha seu caminho.")
      .textColor("rgba(255,255,255,0.5)")
      .textFont({ size: '14px', lineHeight: '1.5' })
      .textAlign("center");

    // Botões
    Crafty.e("GameButton")
      .attr({ x: width/2 - 150, y: height - 180, w: 300 })
      .label("ENFRENTAR PERIGOS ⚔️")
      .variant("primary")
      .bind("Click", () => {
        gameState.mode = "combat";
        Crafty.scene("Combat");
      });

    Crafty.e("GameButton")
      .attr({ x: width/2 - 150, y: height - 110, w: 300 })
      .label("BUSCAR RELÍQUIAS ✨")
      .bind("Click", () => {
        gameState.mode = "event";
        Crafty.scene("Event");
      });
  });

  Crafty.scene("Combat", function() {
    Crafty.background("linear-gradient(to bottom, #1e1b4b, #020617)");
    
    const monsterEmojis = ["👺", "🐺", "🕷️", "💀", "👻"];
    const enemy = {
      name: gameState.mode === "boss" ? "Mestre das Sombras" : "Criatura Abissal",
      emoji: gameState.mode === "boss" ? "🐲" : monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)],
      hp: gameState.mode === "boss" ? 250 : 70,
      maxHp: gameState.mode === "boss" ? 250 : 70,
      atk: gameState.mode === "boss" ? 22 : 14
    };

    // UI de Combate - Topo (Inimigo)
    Crafty.e("2D, DOM, Text")
      .attr({ x: 0, y: 40, w: width })
      .text(enemy.name.toUpperCase())
      .textColor("rgba(255,255,255,0.4)")
      .textFont({ size: '11px', weight: '900' })
      .textAlign("center")
      .css({ "letter-spacing": "0.2em" });

    const enemyEntity = Crafty.e("Entity")
      .attr({ x: 0, y: 80, w: width })
      .setEmoji(enemy.emoji)
      .textAlign("center");

    const enemyHPBg = Crafty.e("2D, DOM, Color")
      .attr({ x: width/2 - 80, y: 160, w: 160, h: 4 })
      .color("rgba(255,255,255,0.1)");
    
    const enemyHPFill = Crafty.e("2D, DOM, Color")
      .attr({ x: width/2 - 80, y: 160, w: 160, h: 4, z: 2 })
      .color("#ef4444")
      .css({ "box-shadow": "0 0 10px #ef4444" });

    // Centro (Status Log)
    const logText = Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: height/2 - 20, w: width - 40 })
      .text("O combate começou!")
      .textColor("#fff")
      .textFont({ size: '16px', weight: '600' })
      .textAlign("center");

    // Fundo (Player)
    const playerEntity = Crafty.e("Entity")
      .attr({ x: 0, y: height/2 + 40, w: width })
      .setEmoji(gameState.player.emoji)
      .textAlign("center");

    const playerHPBg = Crafty.e("2D, DOM, Color")
      .attr({ x: width/2 - 80, y: height/2 + 130, w: 160, h: 4 })
      .color("rgba(255,255,255,0.1)");
    
    const playerHPFill = Crafty.e("2D, DOM, Color")
      .attr({ x: width/2 - 80, y: height/2 + 130, w: 160, h: 4, z: 2 })
      .color("#3b82f6")
      .css({ "box-shadow": "0 0 10px #3b82f6" });

    const updateBars = () => {
      enemyHPFill.attr({ w: (enemy.hp / enemy.maxHp) * 160 });
      playerHPFill.attr({ w: (gameState.player.hp / gameState.player.maxHp) * 160 });
    };

    // Botões de Ação (Mobile-First)
    const actionArea = Crafty.e("2D, DOM, Color")
      .attr({ x: 0, y: height - 140, w: width, h: 140 })
      .color("rgba(0,0,0,0.4)")
      .css({ "backdrop-filter": "blur(12px)", "border-top": "1px solid rgba(255,255,255,0.1)" });

    const atkBtn = Crafty.e("GameButton")
      .attr({ x: 20, y: height - 100, w: (width - 60) / 2 })
      .label("ATACAR ⚔️")
      .variant("primary")
      .bind("Click", () => turn("attack"));

    const feBtn = Crafty.e("GameButton")
      .attr({ x: width/2 + 10, y: height - 100, w: (width - 60) / 2 })
      .label("USAR FÉ ✨")
      .variant("warning")
      .bind("Click", () => quiz());

    const turn = (type) => {
      if (type === "attack") {
        enemy.hp -= gameState.player.atk;
        logText.text(`Você golpeou causando ${gameState.player.atk} dano!`);
        enemyEntity.css({ "transform": "translateX(10px)" });
        setTimeout(() => enemyEntity.css({ "transform": "translateX(0)" }), 100);
      }
      checkEnd();
    };

    const quiz = () => {
      atkBtn.visible = feBtn.visible = false;
      const q = QUESTOES_FE[Math.floor(Math.random() * QUESTOES_FE.length)];
      
      const qOverlay = Crafty.e("2D, DOM, Color")
        .attr({ x: 0, y: 0, w: width, h: height, z: 1000 })
        .color("rgba(2, 6, 23, 0.98)");

      Crafty.e("2D, DOM, Text")
        .attr({ x: 20, y: 80, w: width - 40, z: 1001 })
        .text("PROVA DE FÉ")
        .textColor("#fbbf24")
        .textFont({ size: '12px', weight: '900' })
        .textAlign("center")
        .css({ "letter-spacing": "0.3em" });

      Crafty.e("2D, DOM, Text")
        .attr({ x: 30, y: 130, w: width - 60, z: 1001 })
        .text(q.pergunta)
        .textColor("#fff")
        .textFont({ size: '20px', weight: '600', lineHeight: '1.4' })
        .textAlign("center");

      q.opcoes.forEach((opt, i) => {
        Crafty.e("GameButton")
          .attr({ x: width/2 - 150, y: 280 + (i * 64), z: 1001, w: 300 })
          .label(opt)
          .bind("Click", function() {
            if (i === q.correta) {
              enemy.hp -= q.dano;
              logText.text(`LUZ DIVINA! ${q.dano} de dano crítico!`);
              logText.textColor("#fbbf24");
            } else {
              gameState.player.hp -= 15;
              logText.text("Você hesitou e se feriu...");
              logText.textColor("#ef4444");
            }
            qOverlay.destroy();
            Crafty("2D, DOM").each(function() { if(this.z >= 1000) this.destroy(); });
            atkBtn.visible = feBtn.visible = true;
            checkEnd();
          });
      });
    };

    const checkEnd = () => {
      updateBars();
      if (enemy.hp <= 0) {
        logText.text("O inimigo foi dissipado!");
        setTimeout(() => gameState.mode === "boss" ? victory() : Crafty.scene("Exploration", gameState.dungeonProgress++), 1200);
        return;
      }
      
      // Turno Inimigo
      setTimeout(() => {
        gameState.player.hp -= enemy.atk;
        updateBars();
        logText.text(`${enemy.name} revidou com ${enemy.atk} de dano!`);
        logText.textColor("#fff");
        if (gameState.player.hp <= 0) gameOver();
      }, 800);
    };

    const victory = () => {
      Crafty.e("2D, DOM, Color")
        .attr({ x: 0, y: 0, w: width, h: height, z: 5000 })
        .color("rgba(0,0,0,0.9)")
        .css({ "display": "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center" });
      
      Crafty.e("2D, DOM, Text")
        .attr({ x: 0, y: height/2 - 100, w: width, z: 5001 })
        .text("👑")
        .textFont({ size: '100px' })
        .textAlign("center");

      Crafty.e("2D, DOM, Text")
        .attr({ x: 0, y: height/2 + 20, w: width, z: 5001 })
        .text("VITÓRIA LENDÁRIA")
        .textColor("#fbbf24")
        .textFont({ size: '24px', weight: '900' })
        .textAlign("center");

      if (onFinish) onFinish(100);
      setTimeout(() => window.location.href = "/dashboard", 3500);
    };

    const gameOver = () => {
      logText.text("Sua jornada termina aqui...");
      setTimeout(() => window.location.reload(), 2000);
    };
  });

  Crafty.scene("Event", function() {
    Crafty.background("#020617");
    
    Crafty.e("2D, DOM, Text")
      .attr({ x: 0, y: height/4, w: width })
      .text("🎁")
      .textFont({ size: '80px' })
      .textAlign("center");

    Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: height/4 + 100, w: width - 40 })
      .text("Encontro Inesperado")
      .textColor("#fbbf24")
      .textFont({ size: '24px', weight: '800' })
      .textAlign("center");

    Crafty.e("2D, DOM, Text")
      .attr({ x: 40, y: height/4 + 150, w: width - 80 })
      .text("Um sábio viajante lhe oferece um bálsamo restaurador.")
      .textColor("rgba(255,255,255,0.6)")
      .textFont({ size: '14px', lineHeight: '1.6' })
      .textAlign("center");

    Crafty.e("GameButton")
      .attr({ x: width/2 - 150, y: height - 160, w: 300 })
      .label("ACEITAR AJUDA 🧪")
      .variant("primary")
      .bind("Click", () => {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 30);
        gameState.dungeonProgress++;
        Crafty.scene("Exploration");
      });

    Crafty.e("GameButton")
      .attr({ x: width/2 - 150, y: height - 90, w: 300 })
      .label("RECUSAR E SEGUIR")
      .bind("Click", () => {
        gameState.dungeonProgress++;
        Crafty.scene("Exploration");
      });
  });

  Crafty.scene("Boss", function() {
    gameState.mode = "boss";
    Crafty.scene("Combat");
  });

  Crafty.scene("Loading");
  return Crafty;
};
