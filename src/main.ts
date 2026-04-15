// ドメインで使う基本的な型
type Brand<K, T> = K & { __brand: T };

type TaskId = Brand<string, "TaskId">;
type UserId = Brand<string, "UserId">;

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: TaskId;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee: UserId | null;
  createdAt: Date;
  updatedAt: Date;
}

// 不変条件を守るためのResult型
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E> = Ok<T> | Err<E>;

const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = <E>(error: E): Err<E> => ({ ok: false, error });

// ドメインエラー
type TaskError =
  | { type: "TitleEmpty" }
  | { type: "TitleTooLong"; max: number }
  | { type: "InvalidStatusTransition"; from: TaskStatus; to: TaskStatus };

// ファクトリ：Taskを作る唯一の入口
const createTask = (params: {
  id: TaskId;
  title: string;
  description?: string;
  assignee?: UserId | null;
}): Result<Task, TaskError> => {
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
const canTransition = (from: TaskStatus, to: TaskStatus): boolean => {
  if (from === to) return true;
  if (from === "todo" && to === "in_progress") return true;
  if (from === "in_progress" && (to === "todo" || to === "done")) return true;
  return false;
};

const changeStatus = (
  task: Task,
  to: TaskStatus
): Result<Task, TaskError> => {
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
