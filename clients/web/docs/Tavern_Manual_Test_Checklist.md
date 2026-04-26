# Tavern Manual Test Checklist

1. 打开 `game.sketchgame.net`。
2. 登录。
3. 进入 `TavernPage`。
4. 确认显示 3 个任务卡。
5. 点击喝酒。
6. 确认干粮增加，任务卡不刷新。
7. 点击一个任务。
8. 确认进入 `IN_PROGRESS`。
9. 确认倒计时显示。
10. 点击跳过。
11. 确认出现结算弹窗。
12. 关闭弹窗。
13. 确认回到 `IDLE`，显示下一组三选一。
14. 再开始一个任务。
15. 等倒计时到 0。
16. 点击完成。
17. 确认出现结算弹窗。
18. 确认没有多余 `COMPLETE_MISSION` / `SKIP_MISSION` 请求。
19. 刷新页面。
20. 确认 `TAVERN_GET_INFO` 能恢复正确状态。
