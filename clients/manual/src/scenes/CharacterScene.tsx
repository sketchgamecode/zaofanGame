export function CharacterScene() {
  return (
    <div className="scene scene--character">
      <div className="scene__banner scene__banner--left">人物总览</div>
      <div className="character-board">
        <div className="character-board__paper">角色大立绘 / 详细信息弹层预留区</div>
        <div className="character-board__stats">
          <div>力量 STR</div>
          <div>敏捷 DEX</div>
          <div>智力 INT</div>
          <div>体质 CON</div>
          <div>幸运 LCK</div>
        </div>
      </div>
    </div>
  );
}
