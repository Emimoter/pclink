package com.pclink.app.data.repository

import com.pclink.app.data.local.dao.FavoriteDao
import com.pclink.app.data.local.entity.FavoriteEntity
import com.pclink.app.domain.model.Product
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class FavoritesRepository @Inject constructor(
    private val favoriteDao: FavoriteDao,
    private val productRepository: ProductRepository
) {
    fun observeFavoriteIds(): Flow<Set<String>> =
        favoriteDao.observeIds().map { it.toSet() }

    fun observeFavorites(): Flow<List<Product>> =
        favoriteDao.observeAll().map { entries ->
            entries.mapNotNull { productRepository.getById(it.productId) }
        }

    suspend fun toggle(productId: String): Boolean {
        val isFav = favoriteDao.isFavorite(productId)
        if (isFav) favoriteDao.remove(productId) else favoriteDao.add(FavoriteEntity(productId))
        return !isFav
    }

    suspend fun add(productId: String) {
        favoriteDao.add(FavoriteEntity(productId))
    }

    suspend fun remove(productId: String) {
        favoriteDao.remove(productId)
    }
}
