// components/TweetSearch.tsx
import { useState } from 'react'
import axios from 'axios'

export default function TweetSearch() {
  const [keyword, setKeyword] = useState('')
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(false)

  const searchTweets = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/twitter?keyword=${keyword}`)
      console.log('Tweets found:', response.data)
      setTweets(response.data)
    } catch (error) {
      console.error('Error fetching tweets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword to search"
          className="border p-2 rounded"
        />
        <button 
          onClick={searchTweets}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div className="mt-4">
        {tweets.map((tweet: { id: string; text: string; created_at: string }) => (
          <div key={tweet.id} className="border p-4 my-2 rounded">
            <p>{tweet.text}</p>
            <small className="text-gray-500">
              {new Date(tweet.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  )
}