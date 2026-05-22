package com.pclink.app.di

import android.content.Context
import androidx.room.Room
import com.pclink.app.data.local.PClinkDatabase
import com.pclink.app.data.local.dao.CartDao
import com.pclink.app.data.local.dao.CustomProductDao
import com.pclink.app.data.local.dao.FavoriteDao
import com.pclink.app.data.local.dao.SearchHistoryDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): PClinkDatabase =
        Room.databaseBuilder(ctx, PClinkDatabase::class.java, PClinkDatabase.DB_NAME)
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideFavoriteDao(db: PClinkDatabase): FavoriteDao = db.favoriteDao()
    @Provides fun provideCartDao(db: PClinkDatabase): CartDao = db.cartDao()
    @Provides fun provideSearchHistoryDao(db: PClinkDatabase): SearchHistoryDao = db.searchHistoryDao()
    @Provides fun provideCustomProductDao(db: PClinkDatabase): CustomProductDao = db.customProductDao()
}
