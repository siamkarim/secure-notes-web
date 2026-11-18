import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Page, Post } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { usePagedList } from '../api/usePagedList';
import { ErrorText, formatDate, PageHeader, Pager, useSubmit } from '../components/ui';

/** Posts of one user. Without an :id in the URL it shows (and lets you add to) your own. */
export function PostsPage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params.id ?? user!._id;
  const isMine = userId === user?._id;

  // GET /users/:id/posts is the $lookup aggregation; it also returns the author's name.
  const list = usePagedList<Post>(`/users/${userId}/posts`);
  const [authorName, setAuthorName] = useState('');
  useEffect(() => {
    if (isMine) return;
    api<Page<Post> & { user: { name: string } }>(`/users/${userId}/posts?limit=1`)
      .then((res) => setAuthorName(res.user.name))
      .catch(() => setAuthorName(''));
  }, [userId, isMine]);

  const create = useSubmit();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const addPost = create.run(async () => {
    const { post } = await api<{ post: Post }>('/posts', { method: 'POST', body: { title, body } });
    list.first();
    setTitle('');
    setBody('');
  });

  return (
    <main>
      <PageHeader
        title={isMine ? 'My posts' : `Posts by ${authorName || '…'}`}
        subtitle="Posts are public: everyone can read them."
      />

      {isMine && (
        <form onSubmit={addPost} className="stack card card-form">
          <h3>New post</h3>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          <textarea placeholder="Share something…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} required maxLength={10000} />
          <ErrorText>{create.error}</ErrorText>
          <button type="submit" disabled={create.busy}>Publish post</button>
        </form>
      )}

      {list.items.map((post) => (
        <article key={post._id} className="card">
          <h3>{post.title}</h3>
          <p className="pre">{post.body}</p>
          <div className="card-footer"><span className="muted">{formatDate(post.createdAt)}</span></div>
        </article>
      ))}

      <Pager list={list} emptyText="No posts yet." />
    </main>
  );
}
