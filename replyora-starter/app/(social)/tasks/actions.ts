"use server";

import { revalidatePath } from "next/cache";

import {
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
  type TaskStatus,
} from "@/lib/social/tasks";

export async function createTaskAction(input: {
  title: string;
  status?: TaskStatus;
  dueAt?: string | null;
}): Promise<void> {
  if (!input.title.trim()) return;
  await createTask(input);
  revalidatePath("/tasks");
}

export async function moveTaskAction(id: string, status: TaskStatus): Promise<void> {
  await updateTaskStatus(id, status);
  revalidatePath("/tasks");
}

export async function updateTaskAction(
  id: string,
  fields: { title?: string; dueAt?: string | null },
): Promise<void> {
  await updateTask(id, fields);
  revalidatePath("/tasks");
}

export async function deleteTaskAction(id: string): Promise<void> {
  await deleteTask(id);
  revalidatePath("/tasks");
}
