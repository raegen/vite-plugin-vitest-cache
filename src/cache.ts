import fs from 'node:fs/promises';
import { File, inject, Suite, Task } from 'vitest';
import { getInjectKey } from './util.js';

export interface CacheEntry {
  data: SerializedTask;
  path: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    'vitest-cache:setup:duration': number;

    [key: string]: CacheEntry;
  }
}

type SerializedTask = Task & {
  tasks: SerializedTask[];
}

const serializeTask = (task: Task): SerializedTask => {
  const tasks = 'tasks' in task && task.tasks || [];

  delete task.file;
  delete task.suite;

  return ({
    ...task,
    result: {
      ...task.result,
      cache: true,
    },
    tasks: tasks.map(serializeTask),
  });
};

const isFile = (task: Task | SerializedTask): task is File => 'filepath' in task;
const isSuite = (task: Task | SerializedTask): task is Suite => task.type === 'suite';

const hasTasks = (task: Task | SerializedTask): task is Suite => 'tasks' in task && !!task.tasks?.length;

const deserializeTask = (task: SerializedTask): File | Suite | Task => {
  const tasks = 'tasks' in task && task.tasks || undefined;

  if (hasTasks(task)) {
    const file = task && isFile(task) ? task : undefined;
    const suite = task && isSuite(task) ? task : undefined;
    return {
      ...task,
      tasks: tasks.map((task) => deserializeTask({
        ...task,
        file,
        suite,
      })),
    };
  }

  return task;
};

export class TaskCache {
  restore(file: string) {
    const cache = inject(getInjectKey('file', file));

    if (!cache) {
      return null;
    }

    return cache.data ? deserializeTask(cache.data) : null;
  }

  save(task: Suite) {
    const cache = inject(getInjectKey('file', task.filepath));

    if (!cache) {
      return null;
    }

    return fs.writeFile(cache.path, JSON.stringify(serializeTask(task)), {
      encoding: 'utf-8',
    });
  }
}
