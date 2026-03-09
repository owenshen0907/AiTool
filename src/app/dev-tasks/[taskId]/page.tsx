import TaskDetailClient from './TaskDetailClient';

export default function DevTaskDetailPage({ params }: { params: { taskId: string } }) {
    return <TaskDetailClient taskId={params.taskId} />;
}
