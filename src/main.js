"use strict";
const ok = (value) => ({ ok: true, value });
const err = (error) => ({ ok: false, error });
// ファクトリ：Taskを作る唯一の入口
const createTask = (params) => {
    const trimmed = params.title.trim();
    if (trimmed.length === 0) {
        return err({ type: "TitleEmpty" });
    }
    if (trimmed.length > 100) {
        return err({ type: "TitleTooLong", max: 100 });
    }
    const now = new Date();
    return ok({
        id: params.id,
        title: trimmed,
        description: params.description,
        status: "todo",
        assignee: params.assignee ?? null,
        createdAt: now,
        updatedAt: now,
    });
};
// 状態遷移ルールを型＋ロジックで閉じ込める
const canTransition = (from, to) => {
    if (from === to)
        return true;
    if (from === "todo" && to === "in_progress")
        return true;
    if (from === "in_progress" && (to === "todo" || to === "done"))
        return true;
    return false;
};
const changeStatus = (task, to) => {
    if (!canTransition(task.status, to)) {
        return err({
            type: "InvalidStatusTransition",
            from: task.status,
            to,
        });
    }
    return ok({
        ...task,
        status: to,
        updatedAt: new Date(),
    });
};
