package com.pclink.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.pclink.app.data.local.dao.CartDao
import com.pclink.app.data.local.dao.CustomProductDao
import com.pclink.app.data.local.dao.FavoriteDao
import com.pclink.app.data.local.dao.SearchHistoryDao
import com.pclink.app.data.local.entity.CartEntity
import com.pclink.app.data.local.entity.CustomProductEntity
import com.pclink.app.data.local.entity.FavoriteEntity
import com.pclink.app.data.local.entity.SearchHistoryEntity

@Database(
    entities = [
        FavoriteEntity::class,
        CartEntity::class,
        SearchHistoryEntity::class,
        CustomProductEntity::class
    ],
    version = 3,
    exportSchema = true
)
abstract class PClinkDatabase : RoomDatabase() {
    abstract fun favoriteDao(): FavoriteDao
    abstract fun cartDao(): CartDao
    abstract fun searchHistoryDao(): SearchHistoryDao
    abstract fun customProductDao(): CustomProductDao

    companion object {
        const val DB_NAME = "pclink.db"
    }
}
