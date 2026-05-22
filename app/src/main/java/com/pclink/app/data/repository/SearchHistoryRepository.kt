package com.pclink.app.data.repository

import com.pclink.app.data.local.dao.SearchHistoryDao
import com.pclink.app.data.local.entity.SearchHistoryEntity
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class SearchHistoryRepository @Inject constructor(
    private val dao: SearchHistoryDao
) {
    fun observeRecent(): Flow<List<String>> =
        dao.observeRecent().map { entries -> entries.map { it.query } }

    suspend fun record(query: String) {
        if (query.isBlank()) return
        dao.insert(SearchHistoryEntity(query.trim(), System.currentTimeMillis()))
    }

    suspend fun delete(query: String) {
        dao.delete(query)
    }

    suspend fun clear() {
        dao.clear()
    }
}
