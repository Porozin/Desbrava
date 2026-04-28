import Crafty from "craftyjs";

export const initGame = (element, user) => {
  // Configurações Iniciais
  const width = element.clientWidth;
  const height = element.clientHeight;

  Crafty.init(width, height, element);
  Crafty.background("#000");

  // Estado Global do Jogo
  const gameState = {
    mode: "exploration", // exploration, combat, event, boss
    player: {
      name: user.displayName || "Caçador",
      hp: 100,
      maxHp: 100,
      atk: 15,
      fe: 10,
      xp: user.xp || 0
    },
    currentEnemy: null,
    dungeonProgress: 0
  };

  // --- COMPONENTES ---

  Crafty.c("Player", {
    init: function() {
      this.addComponent("2D, DOM, Color");
      this.attr({ w: 50, h: 50, x: width / 2 - 25, y: height / 2 - 25 });
      this.color("#3b82f6");
    }
  });

  // --- CENAS ---

  // Cena de Carregamento
  Crafty.scene("Loading", function() {
    Crafty.e("2D, DOM, Text")
      .attr({ x: width/2 - 100, y: height/2, w: 200 })
      .text("Carregando Masmorra...")
      .textColor("#fff")
      .textAlign("center");
    
    // Simular carregamento de assets
    setTimeout(() => {
      Crafty.scene("Exploration");
    }, 1000);
  });

  // Cena de Exploração
  Crafty.scene("Exploration", function() {
    Crafty.background("#0f172a");
    
    Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: 20, w: width - 40 })
      .text("Caminho Sombrio")
      .textColor("#64748b")
      .textFont({ size: '14px', weight: 'bold' });

    Crafty.e("2D, DOM, Text")
      .attr({ x: width/2 - 150, y: height/3, w: 300 })
      .text("Você se depara com uma bifurcação. Onde deseja seguir?")
      .textColor("#fff")
      .textAlign("center");

    // Botão Opção A (Combate)
    const btnA = Crafty.e("2D, DOM, Color, Text, Mouse")
      .attr({ x: width/2 - 120, y: height/2, w: 240, h: 50 })
      .color("rgba(59, 130, 246, 0.2)")
      .text("Caminho dos Desafios (Combate)")
      .textColor("#fff")
      .css({ 
        "border": "1px solid #3b82f6", 
        "border-radius": "8px", 
        "display": "flex", 
        "align-items": "center", 
        "justify-content": "center",
        "cursor": "pointer"
      })
      .bind("Click", function() {
        gameState.mode = "combat";
        Crafty.scene("Combat");
      });

    // Botão Opção B (Evento)
    const btnB = Crafty.e("2D, DOM, Color, Text, Mouse")
      .attr({ x: width/2 - 120, y: height/2 + 70, w: 240, h: 50 })
      .color("rgba(139, 92, 246, 0.2)")
      .text("Caminho do Mistério (Evento)")
      .textColor("#fff")
      .css({ 
        "border": "1px solid #8b5cf6", 
        "border-radius": "8px", 
        "display": "flex", 
        "align-items": "center", 
        "justify-content": "center",
        "cursor": "pointer"
      })
      .bind("Click", function() {
        gameState.mode = "event";
        Crafty.scene("Event");
      });
  });

  // Cena de Combate
  Crafty.scene("Combat", function() {
    Crafty.background("#1e1b4b");
    
    const enemy = {
      name: "Sombra do Desânimo",
      hp: 50,
      maxHp: 50,
      atk: 10
    };

    // UI de Combate
    const statusText = Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: 20, w: width - 40 })
      .text(`${enemy.name} bloqueia seu caminho!`)
      .textColor("#f87171")
      .textFont({ size: '18px', weight: 'bold' });

    const playerHPText = Crafty.e("2D, DOM, Text")
      .attr({ x: 20, y: height - 100, w: 200 })
      .text(`Sua Vida: ${gameState.player.hp}/${gameState.player.maxHp}`)
      .textColor("#3b82f6");

    const enemyHPText = Crafty.e("2D, DOM, Text")
      .attr({ x: width - 220, y: 50, w: 200 })
      .text(`Inimigo: ${enemy.hp}/${enemy.maxHp}`)
      .textColor("#ef4444")
      .textAlign("right");

    // Botão Atacar
    Crafty.e("2D, DOM, Color, Text, Mouse")
      .attr({ x: 20, y: height - 60, w: 100, h: 40 })
      .color("#ef4444")
      .text("ATACAR")
      .textColor("#fff")
      .css({ "border-radius": "4px", "display": "flex", "align-items": "center", "justify-content": "center", "cursor": "pointer" })
      .bind("Click", function() {
        // Turno do Jogador
        enemy.hp -= gameState.player.atk;
        enemyHPText.text(`Inimigo: ${Math.max(0, enemy.hp)}/${enemy.maxHp}`);
        
        if (enemy.hp <= 0) {
          statusText.text("Inimigo derrotado!");
          setTimeout(() => {
            gameState.dungeonProgress += 1;
            Crafty.scene("Exploration");
          }, 1500);
          return;
        }

        // Turno do Inimigo
        gameState.player.hp -= enemy.atk;
        playerHPText.text(`Sua Vida: ${Math.max(0, gameState.player.hp)}/${gameState.player.maxHp}`);
        
        if (gameState.player.hp <= 0) {
          statusText.text("Você caiu em combate...");
          setTimeout(() => {
            location.reload(); // Reset simples
          }, 2000);
        }
      });
  });

  // Cena de Evento (Placeholder)
  Crafty.scene("Event", function() {
    Crafty.background("#0c0a09");
    Crafty.e("2D, DOM, Text")
      .attr({ x: width/2 - 100, y: height/2 })
      .text("Você encontrou um altar de oração. Sente-se renovado.")
      .textColor("#fbbf24");

    setTimeout(() => {
      Crafty.scene("Exploration");
    }, 2000);
  });

  // Iniciar na cena de carregamento
  Crafty.scene("Loading");

  return Crafty;
};
