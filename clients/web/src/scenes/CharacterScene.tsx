export function CharacterScene() {
  return (
    <div className="scene scene--character">
      <div className="scene__banner scene__banner--left">人物总览</div>
      <div className="character-board">
        <div className="character-board__paper">角色大立绘 / 详细信息弹层预留区</div>
        <div className="character-board__stats">
          <div>膂力</div>
          <div>身法</div>
          <div>谋略</div>
          <div>根骨</div>
          <div>气运</div>
        </div>
      </div>
    </div>
  );
}
