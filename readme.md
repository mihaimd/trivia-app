# trivia-app
in android\app\src\main\res\values\strings.xml

<!-- Add For Googlew AdMob -->
<string name="admob_app_id">ca-app-pub-2627242521523254~2888460785</string>

in android\app\src\main\AndroidManifest.xml

<?xml version='1.0' encoding='utf-8'?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
    <application android:allowBackup="true" android:icon="@mipmap/ic_launcher" android:label="@string/app_name" android:roundIcon="@mipmap/ic_launcher_round" android:supportsRtl="true" android:theme="@style/AppTheme" android:usesCleartextTraffic="true">
        <activity android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode" android:exported="true" android:label="@string/title_activity_main" android:launchMode="singleTask" android:name=".MainActivity" android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <provider android:authorities="${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true" android:name="androidx.core.content.FileProvider">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>
        <service android:enabled="false" android:exported="false" android:name="com.google.android.gms.metadata.ModuleDependencies" tools:ignore="MissingClass">
            <intent-filter>
                <action android:name="com.google.android.gms.metadata.MODULE_DEPENDENCIES" />
            </intent-filter>
            <meta-data android:name="photopicker_activity:0:required" android:value="" />
        </service>
        <!-- Added for google admob -->
        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <!-- Added for in-app purchase -->
    <uses-permission android:name="com.android.vending.BILLING" />
</manifest>

in android\gradle.properties added below

RELEASE_STORE_FILE=./android-release.keystore
RELEASE_STORE_PASSWORD=
RELEASE_KEY_ALIAS=release
RELEASE_KEY_PASSWORD=

in android/app create or add new file with name android-release.keystore
like android\app\android-release.keystore

in android\variables.gradle
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    ...
    ...
    ..
    playServicesAdsVersion = '23.0.0'
}

<!-- Below is full code of android/app/build.gradle -->
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // ADDED ON 01-OCT-25


android {
    namespace "com.triviatwist480.app"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.triviatwist480.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 8
        versionName "1.0.5"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
             // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
            ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    /* ADDED ON 25-NOV-2025 START */
    signingConfigs {
        release {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD

            // Optional, specify signing versions used
            v1SigningEnabled true
            v2SigningEnabled true
        }
    }
    /* ADDED ON 25-NOV-2025 END */
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            /* ADDED ON 25-NOV-2025 START */
            signingConfig signingConfigs.release
            /* ADDED ON 25-NOV-2025 END */
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')

    // ADDED ON 01-OCT-25
    // implementation platform('com.google.firebase:firebase-bom:34.3.0') // ADDED ON 01-OCT-25   
    // implementation("com.google.firebase:firebase-auth")
    // UPDATE ON 15-OCT-25
    implementation platform('com.google.firebase:firebase-bom:34.4.0') // UPDATE ON 15-OCT-25 
    implementation 'com.google.firebase:firebase-analytics' // UPDATE ON 15-OCT-25
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}

# firebase rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone with your Firestore database reference to view, edit,
    // and delete all data in your Firestore database. It is useful for getting
    // started, but it is configured to expire after 30 days because it
    // leaves your app open to attackers. At that time, all client
    // requests to your Firestore database will be denied.
    //
    // Make sure to write security rules for your app before that time, or else
    // all client requests to your Firestore database will be denied until you Update
    // your rules
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}