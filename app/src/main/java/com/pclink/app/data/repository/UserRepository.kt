package com.pclink.app.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.pclink.app.domain.model.Address
import com.pclink.app.domain.model.MembershipTier
import com.pclink.app.domain.model.PaymentMethod
import com.pclink.app.domain.model.PaymentType
import com.pclink.app.domain.model.User
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

import kotlinx.coroutines.tasks.await

/**
 * User repository integrated with Firebase Auth.
 */
@Singleton
class UserRepository @Inject constructor() {
    private val auth = FirebaseAuth.getInstance()

    private val _user = MutableStateFlow(GUEST)
    val user: StateFlow<User> = _user.asStateFlow()

    init {
        auth.addAuthStateListener { firebaseAuth ->
            val firebaseUser = firebaseAuth.currentUser
            if (firebaseUser != null) {
                _user.value = User(
                    id = firebaseUser.uid,
                    name = firebaseUser.displayName ?: firebaseUser.email?.substringBefore("@") ?: "Usuario",
                    email = firebaseUser.email ?: "",
                    tier = MembershipTier.STANDARD
                )
            } else {
                _user.value = GUEST
            }
        }
    }

    val isLoggedIn: Boolean get() = _user.value.id != GUEST.id

    suspend fun signIn(email: String, password: String): Result<User> {
        if (email.isBlank() || password.length < 4) {
            return Result.failure(IllegalArgumentException("Credenciales inválidas"))
        }
        return try {
            val result = auth.signInWithEmailAndPassword(email, password).await()
            val firebaseUser = result.user ?: throw Exception("Error al obtener usuario")
            
            val u = User(
                id = firebaseUser.uid,
                name = firebaseUser.displayName ?: email.substringBefore("@"),
                email = email,
                tier = MembershipTier.STANDARD
            )
            _user.value = u
            Result.success(u)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInWithGoogleToken(idToken: String): Result<User> {
        return try {
            val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            val firebaseUser = result.user ?: throw Exception("Error en autenticación con Google")
            
            val u = User(
                id = firebaseUser.uid,
                name = firebaseUser.displayName ?: "Usuario Google",
                email = firebaseUser.email ?: "",
                tier = MembershipTier.GAMER
            )
            _user.value = u
            Result.success(u)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(name: String, email: String, password: String): Result<User> {
        if (name.isBlank() || email.isBlank() || password.length < 6) {
            return Result.failure(IllegalArgumentException("Datos incompletos o contraseña muy corta (min 6)"))
        }
        return try {
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            val firebaseUser = result.user ?: throw Exception("Error al crear cuenta")
            
            // Actualizamos el perfil de Firebase con el nombre
            val profileUpdates = com.google.firebase.auth.userProfileChangeRequest {
                displayName = name
            }
            firebaseUser.updateProfile(profileUpdates).await()

            val u = User(
                id = firebaseUser.uid,
                name = name,
                email = email,
                tier = MembershipTier.STANDARD
            )
            _user.value = u
            Result.success(u)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        auth.signOut()
        _user.value = GUEST
    }

    fun addAddress(address: Address) {
        _user.value = _user.value.copy(addresses = _user.value.addresses + address)
    }

    fun addPaymentMethod(method: PaymentMethod) {
        _user.value = _user.value.copy(paymentMethods = _user.value.paymentMethods + method)
    }

    companion object {
        val GUEST = User(id = "guest", name = "Invitado", email = "")

        private val DEFAULT_ADDRESS = Address(
            id = "addr-1",
            label = "Casa",
            recipient = "Emiliano",
            street = "Av. Corrientes",
            number = "1234",
            apartment = "5B",
            city = "Buenos Aires",
            state = "CABA",
            zip = "1043",
            country = "Argentina",
            isDefault = true
        )

        private val DEFAULT_PAYMENT = PaymentMethod(
            id = "pm-1",
            type = PaymentType.MERCADO_PAGO,
            brand = "Mercado Pago",
            last4 = "·· 4242",
            isDefault = true
        )
    }
}
