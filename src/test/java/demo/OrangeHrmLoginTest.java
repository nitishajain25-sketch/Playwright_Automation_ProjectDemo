package demo;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Locale;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrangeHrmLoginTest {
    @RegisterExtension
    static final TestWatcher screenshotOnFailure = new TestWatcher() {
        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            if (driver == null) {
                return;
            }

            File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            File folder = new File("target/screenshots");
            folder.mkdirs();

            String fileName = context.getRequiredTestMethod().getName() + "_" + System.currentTimeMillis() + ".png";
            File destination = new File(folder, fileName);

            try {
                Files.copy(screenshot.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
                System.out.println("Screenshot saved: " + destination.getAbsolutePath());
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    };

    private static final String LOGIN_URL = System.getenv().getOrDefault(
        "ORANGEHRM_URL",
        "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
    );
    private static final By USERNAME = By.name("username");
    private static final By PASSWORD = By.name("password");
    private static final By SUBMIT = By.cssSelector("button[type='submit']");
    private static final By FIELD_ERRORS = By.cssSelector(".oxd-input-field-error-message");
    private static final By ALERT = By.cssSelector(".oxd-alert-content-text");

    private static WebDriver driver;
    private static WebDriverWait wait;

    @BeforeEach
    void openLoginPage() {
        ChromeOptions options = new ChromeOptions();
        if (Boolean.parseBoolean(System.getenv().getOrDefault("HEADLESS", "true"))) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1440,1000");

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        driver.get(LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(USERNAME));
        wait.until(ExpectedConditions.visibilityOfElementLocated(PASSWORD));
    }

    @AfterEach
    void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void P1_pageTitleContainsOrangeHrm() {
        wait.until(ExpectedConditions.titleContains("OrangeHRM"));
        assertTrue(driver.getTitle().contains("OrangeHRM"));
    }

    @Test
    void P2_usernameFieldIsVisibleWithCorrectPlaceholder() {
        WebElement username = driver.findElement(USERNAME);
        assertTrue(username.isDisplayed());
        assertEquals("Username", username.getDomAttribute("placeholder"));
    }

    @Test
    void P3_passwordFieldIsVisibleAndMasked() {
        WebElement password = driver.findElement(PASSWORD);
        assertTrue(password.isDisplayed());
        assertEquals("password", password.getDomAttribute("type"));
    }

    @Test
    void P4_usernameFieldAcceptsValidUsername() {
        WebElement username = driver.findElement(USERNAME);
        username.sendKeys(validUsername());
        assertEquals(validUsername(), username.getDomProperty("value"));
    }

    @Test
    void P5_passwordFieldAcceptsValidPassword() {
        WebElement password = driver.findElement(PASSWORD);
        password.sendKeys(validPassword());
        assertEquals(validPassword(), password.getDomProperty("value"));
    }

    @Test
    void P6_validCredentialsLogInWithSubmitButton() {
        login(validUsername(), validPassword());
        wait.until(ExpectedConditions.urlContains("/dashboard/index"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard/index"));
    }

    @Test
    void P7_validCredentialsLogInWithEnterKey() {
        driver.findElement(USERNAME).sendKeys(validUsername());
        driver.findElement(PASSWORD).sendKeys(validPassword(), Keys.ENTER);
        wait.until(ExpectedConditions.urlContains("/dashboard/index"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard/index"));
    }

    @Test
    void P8_usernameFieldSupportsTypingAndClearing() {
        WebElement username = driver.findElement(USERNAME);
        username.sendKeys(validUsername());
        assertEquals(validUsername(), username.getDomProperty("value"));
        username.clear();
        assertEquals("", username.getDomProperty("value"));
    }

    @Test
    void P9_passwordFieldSupportsTypingAndClearing() {
        WebElement password = driver.findElement(PASSWORD);
        password.sendKeys(validPassword());
        assertEquals(validPassword(), password.getDomProperty("value"));
        password.clear();
        assertEquals("", password.getDomProperty("value"));
    }

    @Test
    void P10_loginSucceedsWhenUsernameHasLeadingAndTrailingSpaces() {
        login("  " + validUsername() + "  ", validPassword());
        wait.until(ExpectedConditions.urlContains("/dashboard/index"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard/index"));
    }

    @Test
    void N1_emptyUsernameWithValidPasswordShowsRequiredValidation() {
        driver.findElement(PASSWORD).sendKeys(validPassword());
        driver.findElement(SUBMIT).click();
        assertRequiredValidationCount(1);
    }

    @Test
    void N2_validUsernameWithEmptyPasswordShowsRequiredValidation() {
        driver.findElement(USERNAME).sendKeys(validUsername());
        driver.findElement(SUBMIT).click();
        assertRequiredValidationCount(1);
    }

    @Test
    void N3_emptyUsernameAndPasswordShowBothRequiredValidations() {
        driver.findElement(SUBMIT).click();
        assertRequiredValidationCount(2);
    }

    @Test
    void N4_invalidUsernameWithValidPasswordShowsInvalidCredentials() {
        login("invaliduser", validPassword());
        assertInvalidCredentials();
    }

    @Test
    void N5_validUsernameWithWrongPasswordShowsInvalidCredentials() {
        login(validUsername(), "wrongPassword123");
        assertInvalidCredentials();
    }

    private void login(String username, String password) {
        driver.findElement(USERNAME).sendKeys(username);
        driver.findElement(PASSWORD).sendKeys(password);
        driver.findElement(SUBMIT).click();
    }

    private void assertInvalidCredentials() {
        String message = wait.until(ExpectedConditions.visibilityOfElementLocated(ALERT)).getText();
        assertTrue(message.toLowerCase(Locale.ROOT).contains("invalid credentials"),
            "Expected an invalid-credentials message but got: " + message);
        assertFalse(driver.getCurrentUrl().contains("/dashboard/index"));
    }

    private void assertRequiredValidationCount(int expectedCount) {
        wait.until(ExpectedConditions.numberOfElementsToBe(FIELD_ERRORS, expectedCount));
        for (WebElement error : driver.findElements(FIELD_ERRORS)) {
            assertTrue(error.getText().equalsIgnoreCase("Required"),
                "Expected required-field validation but got: " + error.getText());
        }
    }

    private String validUsername() {
        return requireEnvironmentVariable("ORANGEHRM_USERNAME");
    }

    private String validPassword() {
        return requireEnvironmentVariable("ORANGEHRM_PASSWORD");
    }

    private String requireEnvironmentVariable(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                "Set the " + name + " environment variable to run tests requiring valid credentials."
            );
        }
        return value;
    }
}
