import React, { useState, useEffect } from 'react';
import { UserPost } from '../types';
import { databaseService } from '../services/databaseService';

const AdminSocialPanel: React.FC = () => {
  const [posts, setPosts] = useState<UserPost[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setPosts(await databaseService.getSocialPosts());
    };
    fetchData();
  }, []);

  const handleTakeDown = async (postId: string) => {
    const success = await databaseService.takeDownPost(postId);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert('Failed to take down post.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-serif italic text-white">Social_Moderation</h2>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Manage Feed Integrity</p>
      </header>

      <div className="glass-grey border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="glass-light border-b border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            <tr>
              <th className="px-8 py-6">Post_ID</th>
              <th className="px-8 py-6">Handle</th>
              <th className="px-8 py-6">Reports</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-mono">
            {posts.map(post => (
              <tr key={post.id} className="border-b border-white/5 hover:glass-light transition-colors">
                <td className="px-8 py-6 text-zinc-400">{post.id}</td>
                <td className="px-8 py-6 text-white">@{post.userHandle}</td>
                <td className="px-8 py-6 text-red-500">{post.reports}</td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => handleTakeDown(post.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    Take_Down
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSocialPanel;
