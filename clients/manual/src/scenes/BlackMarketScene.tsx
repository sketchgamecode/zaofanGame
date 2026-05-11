export function BlackMarketScene() {
  return (
    <div className="scene scene--blackmarket">
      <div className="scene__banner scene__banner--left">黑市兵器铺</div>
      <div className="scene__banner scene__banner--center">摸坏了要赔。赔不起，就拿命抵。</div>

      <div className="shop-grid">
        <div className="shop-card">货架 1</div>
        <div className="shop-card">货架 2</div>
        <div className="shop-card">货架 3</div>
        <div className="shop-card">货架 4</div>
        <div className="shop-card">货架 5</div>
        <div className="shop-card">货架 6</div>
      </div>

      <div className="shop-npc">铁瞎子立绘区</div>
      <div className="shop-action-bar">
        <div>货币与令牌状态</div>
        <button className="shop-refresh-button" type="button">
          刷新货架
        </button>
      </div>
    </div>
  );
}
